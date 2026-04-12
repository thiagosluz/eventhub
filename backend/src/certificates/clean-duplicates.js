const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  console.log('--- LIMPANDO CERTIFICADOS DUPLICADOS ---');
  
  // Encontrar pares (templateId, registrationId) duplicados
  const duplicates = await prisma.issuedCertificate.groupBy({
    by: ['templateId', 'registrationId'],
    _count: {
      _all: true
    },
    having: {
      templateId: { _count: { gt: 1 } }
    }
  });

  console.log(`Encontrados ${duplicates.length} grupos de duplicados.`);

  for (const dup of duplicates) {
    const { templateId, registrationId } = dup;
    
    // Pegar todos os registros para este par
    const records = await prisma.issuedCertificate.findMany({
      where: { templateId, registrationId },
      orderBy: { issuedAt: 'desc' }
    });

    // Manter o mais recente, excluir os outros
    const idsToDelete = records.slice(1).map(r => r.id);
    
    await prisma.issuedCertificate.deleteMany({
      where: {
        id: { in: idsToDelete }
      }
    });
    
    console.log(`Grupo (${templateId}, ${registrationId}): Mantido ${records[0].id}, Excluídos ${idsToDelete.length}`);
  }

  process.exit(0);
}

clean().catch(e => {
  console.error(e);
  process.exit(1);
});
