import { Injectable, NotFoundException } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

// Removido LayoutPlaceholder (Legado)

interface TextBlock {
  text: string;
  x: number;
  y: number;
  width?: number;
  fontSize?: number;
  lineHeight?: number;
  color?: string;
  align?: "left" | "center" | "right" | "justify";
}

interface LayoutConfig {
  textBlocks?: TextBlock[];
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

    const textBlocks = layoutConfig.textBlocks ?? [];

    const validationHash = "PREVIEW-HASH-123456";
    const qrCodeBuffer = await QRCode.toBuffer(
      "https://eventhub.com/validate/preview",
    );

    return this.renderPdf(
      backgroundUrl,
      data,
      qrCodeBuffer,
      [],
      validationHash,
      textBlocks,
    );
  }

  async generateAndStore(
    templateId: string,
    registrationId: string,
    strategy: "skip" | "overwrite" = "skip",
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

    // Se a estratégia for "skip", verificar se já existe um certificado emitido
    const existing = await this.prisma.issuedCertificate.findFirst({
      where: { templateId, registrationId },
    });

    if (existing && strategy === "skip") {
      return { fileUrl: existing.fileUrl, issuedId: existing.id };
    }

    const data: Record<string, string> = {
      participantName: registration.user.name,
      eventName: registration.event.name,
      workload: "8h",
    };

    const layout = (template.layoutConfig as LayoutConfig) ?? {};
    const textBlocks = layout.textBlocks ?? [];

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
      data,
      qrCodeBuffer,
      attendances,
      validationHash,
      textBlocks,
    );

    const objectName = `certificates/${template.eventId}/${registrationId}-${Date.now()}.pdf`;
    const fileUrl = await this.minio.uploadObject({
      bucket: "certificates",
      objectName,
      data: pdfBuffer,
      contentType: "application/pdf",
    });

    if (existing) {
      // Opcional: deletar arquivo antigo do MinIO se desejar economizar espaço
      const updated = await this.prisma.issuedCertificate.update({
        where: { id: existing.id },
        data: {
          fileUrl,
          validationHash,
          issuedAt: new Date(),
        },
      });
      return { fileUrl, issuedId: updated.id };
    }

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
    data: Record<string, string>,
    qrCodeBuffer?: Buffer,
    attendances?: any[],
    validationHash?: string,
    textBlocks: TextBlock[] = [],
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

      // Removido render de placeholders (Legado)

      // Render Dynamic Text Blocks
      for (const block of textBlocks) {
        this.drawRichTextBlock(doc, block, data);
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

  private drawRichTextBlock(
    doc: PDFKit.PDFDocument,
    block: TextBlock,
    data: Record<string, string>,
  ) {
    // 1. Preparar fragmentos
    const variablePattern = /\{\{(.*?)\}\}/g;
    const allFragments: Array<{ text: string; isBold: boolean }> = [];
    let lastIndex = 0;
    let match;

    while ((match = variablePattern.exec(block.text)) !== null) {
      if (match.index > lastIndex) {
        allFragments.push({
          text: block.text.substring(lastIndex, match.index),
          isBold: false,
        });
      }
      const key = match[1].trim();
      allFragments.push({
        text: data[key] || `{{${key}}}`,
        isBold: true,
      });
      lastIndex = variablePattern.lastIndex;
    }
    if (lastIndex < block.text.length) {
      allFragments.push({
        text: block.text.substring(lastIndex),
        isBold: false,
      });
    }

    // 2. Motor de Quebra de Linha (Word Wrap Manual)
    const fontSize = block.fontSize || 16;
    const maxWidth = block.width || 800;
    const align = block.align || "left";
    const lineHeight = block.lineHeight || 1.2;

    doc.fontSize(fontSize);

    interface LineFragment {
      text: string;
      isBold: boolean;
      width: number;
    }

    interface Line {
      fragments: LineFragment[];
      totalWidth: number;
    }

    const lines: Line[] = [];
    let currentLine: Line = { fragments: [], totalWidth: 0 };

    for (const frag of allFragments) {
      const words = frag.text.split(/(\s+)/);

      for (const word of words) {
        if (word === "") continue;

        doc.font(frag.isBold ? "Helvetica-Bold" : "Helvetica");
        const wordWidth = doc.widthOfString(word);

        if (
          currentLine.totalWidth + wordWidth > maxWidth &&
          currentLine.fragments.length > 0
        ) {
          lines.push(currentLine);
          currentLine = { fragments: [], totalWidth: 0 };
          if (word.trim() === "") continue;
        }

        const lastFragInLine =
          currentLine.fragments[currentLine.fragments.length - 1];
        if (lastFragInLine && lastFragInLine.isBold === frag.isBold) {
          lastFragInLine.text += word;
          lastFragInLine.width += wordWidth;
        } else {
          currentLine.fragments.push({
            text: word,
            isBold: frag.isBold,
            width: wordWidth,
          });
        }
        currentLine.totalWidth += wordWidth;
      }
    }
    if (currentLine.fragments.length > 0) {
      lines.push(currentLine);
    }

    // 3. Renderização
    doc.fillColor(block.color || "#000000");
    let currentY = block.y;

    for (const line of lines) {
      let currentX = block.x;

      if (align === "center") {
        currentX = block.x + (maxWidth - line.totalWidth) / 2;
      } else if (align === "right") {
        currentX = block.x + (maxWidth - line.totalWidth);
      }

      for (const frag of line.fragments) {
        doc.font(frag.isBold ? "Helvetica-Bold" : "Helvetica");
        doc.text(frag.text, currentX, currentY, { lineBreak: false });
        currentX += frag.width;
      }

      currentY += fontSize * lineHeight;
    }
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
