import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { CertificatePdfService } from "../certificates/certificate-pdf.service";
import { PrismaService } from "../prisma/prisma.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const pdfService = app.get(CertificatePdfService);
  const prisma = app.get(PrismaService);

  const template = await prisma.certificateTemplate.findFirst({
    where: { name: "Certificado de Teste Premium" },
  });

  const registration = await prisma.registration.findFirst({
    where: { event: { slug: "summit-2026" } },
  });

  if (!template || !registration) {
    console.error("Template ou Inscrição não encontrados.");
    await app.close();
    return;
  }

  console.log(
    `Emitindo para Template: ${template.id}, Inscrição: ${registration.id}`,
  );

  try {
    const result = await pdfService.generateAndStore(
      template.id,
      registration.id,
    );
    console.log("Certificado emitido com sucesso!");
    console.log("URL:", result.fileUrl);
  } catch (error) {
    console.error("Erro na emissão:", error);
  }

  await app.close();
}

bootstrap();
