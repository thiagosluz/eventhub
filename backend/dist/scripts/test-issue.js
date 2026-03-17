"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const certificate_pdf_service_1 = require("../certificates/certificate-pdf.service");
const prisma_service_1 = require("../prisma/prisma.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const pdfService = app.get(certificate_pdf_service_1.CertificatePdfService);
    const prisma = app.get(prisma_service_1.PrismaService);
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
    console.log(`Emitindo para Template: ${template.id}, Inscrição: ${registration.id}`);
    try {
        const result = await pdfService.generateAndStore(template.id, registration.id);
        console.log("Certificado emitido com sucesso!");
        console.log("URL:", result.fileUrl);
    }
    catch (error) {
        console.error("Erro na emissão:", error);
    }
    await app.close();
}
bootstrap();
//# sourceMappingURL=test-issue.js.map