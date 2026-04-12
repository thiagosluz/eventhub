import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  console.log('--- LIMPANDO CERTIFICADOS DUPLICADOS ---');
  
  // Agrupar por templateId e registrationId para encontrar duplicados
  const groups = await prisma.issuedCertificate.findMany({
    select: {
      templateId: true,
      registrationId: true,
    }
  });

  const seen = new Set<string>();
  const toDelete: string[] = [];

  for (const record of groups) {
    const key = `${record.templateId}-${record.registrationId}`;
    if (seen.has(key)) {
      // Já vimos este par, marcar para exclusão (o prisma findMany não garante ordem, mas aqui queremos apenas remover extras)
      continue;
    }
    seen.add(key);
  }

  // Agora vamos pegar os IDs reais para deletar
  // Para cada par, manter apenas o ID com o issuedAt mais recente
  const uniquePairs = Array.from(seen).map(s => {
    const [t, r] = s.split('-');
    return { templateId: t, registrationId: r };
  });

  for (const pair of uniquePairs) {
    const allForPair = await prisma.issuedCertificate.findMany({
      where: pair,
      orderBy: { issuedAt: 'desc' }
    });

    if (allForPair.length > 1) {
      const idsToRemove = allForPair.slice(1).map(c => c.id);
      await prisma.issuedCertificate.deleteMany({
        where: { id: { in: idsToRemove } }
      });
      console.log(`Par ${pair.templateId}/${pair.registrationId}: Removidos ${idsToRemove.length} duplicados.`);
    }
  }

  console.log('Limpeza concluída.');
  process.exit(0);
}

clean().catch(e => {
  console.error(e);
  process.exit(1);
});
