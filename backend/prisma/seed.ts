import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Limpando banco de dados...');
  
  // Ordem reversa de dependências
  await prisma.attendance.deleteMany();
  await prisma.issuedCertificate.deleteMany();
  await prisma.certificateTemplate.deleteMany();
  await prisma.review.deleteMany();
  await prisma.customFormAnswer.deleteMany();
  await prisma.customFormResponse.deleteMany();
  await prisma.customFormField.deleteMany();
  await prisma.customForm.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.activityEnrollment.deleteMany();
  await prisma.activitySpeaker.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.speaker.deleteMany();
  await prisma.activityType.deleteMany();
  await prisma.speakerRole.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('Criando dados padrão...');

  const passwordHash = await argon2.hash('123456');

  // 1. Tenant Principal
  const tenant = await prisma.tenant.create({
    data: {
      name: 'EventHub HQ',
      slug: 'eventhub-hq',
      themeConfig: {
        primaryColor: '#6366f1'
      }
    }
  });

  // 2. Usuários
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@eventhub.com.br',
        name: 'Administrador EventHub',
        password: passwordHash,
        role: 'ORGANIZER',
        tenantId: tenant.id
      },
      {
        email: 'organizador@eventhub.com.br',
        name: 'Thiago Organizador',
        password: passwordHash,
        role: 'ORGANIZER',
        tenantId: tenant.id
      },
      {
        email: 'participante@eventhub.com.br',
        name: 'Ana Participante',
        password: passwordHash,
        role: 'PARTICIPANT',
        tenantId: tenant.id
      },
      {
        email: 'revisor@eventhub.com.br',
        name: 'Carlos Revisor',
        password: passwordHash,
        role: 'REVIEWER',
        tenantId: tenant.id
      }
    ]
  });

  // 3. Tipos e Papéis Padrão
  const typePalestra = await prisma.activityType.create({
    data: { name: 'Palestra', tenantId: tenant.id }
  });
  
  const rolePalestrante = await prisma.speakerRole.create({
    data: { name: 'Palestrante', tenantId: tenant.id }
  });

  // 4. Evento de Teste
  const event = await prisma.event.create({
    data: {
      name: 'Summit Tecnológico 2026',
      slug: 'summit-2026',
      description: 'O maior evento de tecnologia do EventHub.',
      location: 'Centro de Convenções Digital',
      startDate: new Date('2026-10-10T09:00:00Z'),
      endDate: new Date('2026-10-12T18:00:00Z'),
      status: 'PUBLISHED',
      tenantId: tenant.id,
      themeConfig: { primaryColor: '#6366f1' }
    }
  });

  // 5. Atividade de Teste
  await prisma.activity.create({
    data: {
      eventId: event.id,
      title: 'Abertura: O Futuro da IA',
      description: 'Uma visão profunda sobre o que nos espera.',
      startAt: new Date('2026-10-10T10:00:00Z'),
      endAt: new Date('2026-10-10T11:30:00Z'),
      typeId: typePalestra.id,
      capacity: 500,
      status: 'SCHEDULED'
    }
  });

  console.log('Seed finalizado com sucesso! 🌱');
  console.log('Usuários criados (Senha: 123456):');
  console.log('- admin@eventhub.com.br');
  console.log('- organizador@eventhub.com.br');
  console.log('- participante@eventhub.com.br');
  console.log('- revisor@eventhub.com.br');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
