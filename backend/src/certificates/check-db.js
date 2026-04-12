const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const counts = await prisma.issuedCertificate.groupBy({
      by: ['templateId'],
      _count: {
        _all: true
      }
    });
    
    console.log('--- DB AGGREGATION CHECK ---');
    console.log(JSON.stringify(counts, null, 2));

    const allCertificates = await prisma.issuedCertificate.findMany({
      take: 5,
      select: { id: true, templateId: true, registrationId: true }
    });
    console.log('--- SAMPLE CERTIFICATES ---');
    console.log(JSON.stringify(allCertificates, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

check();
