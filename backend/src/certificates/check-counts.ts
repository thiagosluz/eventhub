import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const templates = await prisma.certificateTemplate.findMany({
    include: {
      _count: {
        select: { issuedCertificates: true }
      }
    }
  });

  console.log('--- DIAGNÓSTICO DE CERTIFICADOS ---');
  templates.forEach(t => {
    console.log(`Template: ${t.name} (ID: ${t.id})`);
    console.log(`Contagem Prisma (_count): ${t._count.issuedCertificates}`);
  });

  const totalIssued = await prisma.issuedCertificate.count();
  console.log(`Total de registros IssuedCertificate: ${totalIssued}`);
  
  process.exit(0);
}

check();
