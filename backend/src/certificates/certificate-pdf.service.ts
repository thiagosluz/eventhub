import { Injectable, NotFoundException } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

interface LayoutPlaceholder {
  key: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  fontFamily?: "Helvetica" | "Helvetica-Bold";
}

interface LayoutConfig {
  placeholders?: LayoutPlaceholder[];
}

@Injectable()
export class CertificatePdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async generatePreview(params: {
    backgroundUrl: string;
    layoutConfig: LayoutConfig;
  }): Promise<Buffer> {
    const { backgroundUrl, layoutConfig } = params;
    const data: Record<string, string> = {
      participantName: "Nome do Participante (Exemplo)",
      eventName: "Nome do Evento (Exemplo)",
      workload: "10h",
    };

    const placeholders = layoutConfig.placeholders ?? [
      { key: "participantName", x: 100, y: 280, fontSize: 24 },
      { key: "eventName", x: 100, y: 340, fontSize: 14 },
      { key: "workload", x: 100, y: 380, fontSize: 12 },
    ];

    return this.renderPdf(backgroundUrl, placeholders, data);
  }

  async generateAndStore(
    templateId: string,
    registrationId: string,
  ): Promise<{ fileUrl: string; issuedId: string }> {
    const template = await this.prisma.certificateTemplate.findFirst({
      where: { id: templateId },
      include: { event: true },
    });
    if (!template) {
      throw new NotFoundException("Template de certificado não encontrado.");
    }

    const registration = await this.prisma.registration.findFirst({
      where: { id: registrationId, eventId: template.eventId },
      include: { user: true, event: true },
    });
    if (!registration) {
      throw new NotFoundException("Inscrição não encontrada para este evento.");
    }

    const data: Record<string, string> = {
      participantName: registration.user.name,
      eventName: registration.event.name,
      workload: "8h",
    };

    const layout = (template.layoutConfig as LayoutConfig) ?? {};
    const placeholders = layout.placeholders ?? [
      { key: "participantName", x: 100, y: 280, fontSize: 24 },
      { key: "eventName", x: 100, y: 340, fontSize: 14 },
      { key: "workload", x: 100, y: 380, fontSize: 12 },
    ];

    const validationHash = uuidv4();
    const validationUrl = `${process.env.FRONTEND_URL || "http://localhost:3001"}/certificates/validate/${validationHash}`;
    const qrCodeBuffer = await QRCode.toBuffer(validationUrl);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        ticket: { registrationId: registration.id },
        activity: { eventId: template.eventId },
      },
      include: { activity: true },
      orderBy: { activity: { startAt: "asc" } },
    });

    const pdfBuffer = await this.renderPdf(
      template.backgroundUrl,
      placeholders,
      data,
      qrCodeBuffer,
      attendances,
      validationHash,
    );

    const objectName = `certificates/${template.eventId}/${registrationId}-${Date.now()}.pdf`;
    const fileUrl = await this.minio.uploadObject({
      bucket: "certificates",
      objectName,
      data: pdfBuffer,
      contentType: "application/pdf",
    });

    const issued = await this.prisma.issuedCertificate.create({
      data: {
        templateId: template.id,
        registrationId: registration.id,
        fileUrl,
        validationHash,
      },
    });

    return { fileUrl, issuedId: issued.id };
  }

  private async renderPdf(
    backgroundUrl: string,
    placeholders: LayoutPlaceholder[],
    data: Record<string, string>,
    qrCodeBuffer?: Buffer,
    attendances?: any[],
    validationHash?: string,
  ): Promise<Buffer> {
    const imageBuffer = await this.fetchImage(backgroundUrl);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // A4 Landscape is 841.89 x 595.28 points
      doc.image(imageBuffer, 0, 0, { width: 841.89, height: 595.28 });

      for (const p of placeholders) {
        const value = data[p.key] ?? "";
        const fontSize = p.fontSize || 16;

        doc.fontSize(fontSize);
        if (p.fontFamily) {
          doc.font(p.fontFamily);
        } else if (p.key === "participantName") {
          doc.font("Helvetica-Bold");
        } else {
          doc.font("Helvetica");
        }

        doc.fillColor(p.color || "#000000");
        doc.text(value, p.x, p.y);
      }

      // ALWAYS add a backside since we want to place the QR Code there
      doc.addPage();
      doc.rect(0, 0, 841.89, 595.28).fill("#ffffff");

      let finalY = 50;

      if (attendances && attendances.length > 0) {
        doc.fillColor("#000000");
        doc.fontSize(24).font("Helvetica-Bold");
        doc.text("Conteúdo Programático", 50, 50);

        doc.fontSize(12).font("Helvetica-Bold");
        let y = 100;

        doc.text("Atividade", 50, y);
        doc.text("Data", 450, y);
        doc.text("Duração", 550, y);
        doc.text("Check-in", 650, y);

        y += 30;
        doc.font("Helvetica");

        for (const att of attendances) {
          if (!att.activity) continue;

          if (y > 420) {
            // Limit max Y to accommodate QR Code at the bottom
            doc.addPage();
            doc.rect(0, 0, 841.89, 595.28).fill("#ffffff");
            doc.fillColor("#000000");
            doc.font("Helvetica");
            y = 50;
          }

          const start = new Date(att.activity.startAt);
          const end = new Date(att.activity.endAt);
          const durationHrs =
            (end.getTime() - start.getTime()) / (1000 * 60 * 60);

          const dateStr = `${String(start.getUTCDate()).padStart(2, "0")}/${String(start.getUTCMonth() + 1).padStart(2, "0")}/${start.getUTCFullYear()}`;
          const checkinDate = new Date(att.checkedAt);
          const checkinStr = `${String(checkinDate.getUTCDate()).padStart(2, "0")}/${String(checkinDate.getUTCMonth() + 1).padStart(2, "0")}/${checkinDate.getUTCFullYear()} ${String(checkinDate.getUTCHours() - 3).padStart(2, "0")}:${String(checkinDate.getUTCMinutes()).padStart(2, "0")}`;

          doc.text(att.activity.title.substring(0, 60), 50, y);
          doc.text(dateStr, 450, y);
          doc.text(`${Math.round(durationHrs * 10) / 10}h`, 550, y);
          doc.text(checkinStr, 650, y);

          y += 25;
        }
        finalY = y;
      }

      if (qrCodeBuffer) {
        // Enforce spacing or add page if it collided with activities
        if (finalY > 430) {
          doc.addPage();
          doc.rect(0, 0, 841.89, 595.28).fill("#ffffff");
        }

        doc.image(qrCodeBuffer, 50, 450, { width: 100 });
        doc.fillColor("#000000");
        doc.fontSize(12).font("Helvetica-Bold");
        doc.text("Validação de Autenticidade", 170, 470);
        doc.fontSize(10).font("Helvetica");
        doc.text(
          "Para verificar a autenticidade deste certificado, aponte a câmera do seu celular para",
          170,
          490,
        );
        doc.text(
          "o QR Code ao lado ou acesse a página de validação on-line.",
          170,
          505,
        );
        if (validationHash) {
          doc.fontSize(11).font("Helvetica-Bold");
          doc.text(`Código verificador: ${validationHash}`, 170, 530);
        }
      }

      doc.end();
    });
  }

  private async fetchImage(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Falha ao carregar imagem do certificado: ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
