import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function seedGamification() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://eventhub:eventhub@localhost:5432/eventhub";
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  // Upsert GamificationConfig (singleton)
  const existing = await prisma.gamificationConfig.findFirst();
  if (!existing) {
    await prisma.gamificationConfig.create({
      data: {
        dailyXpLimit: 1500,
        levelFormulaBase: 500,
        levelFormulaExponent: 0.6,
        spikeThreshold: 1000,
        spikeWindowMinutes: 5,
      },
    });
    console.log("✅ GamificationConfig criada com valores padrão.");
  } else {
    console.log("⏭️  GamificationConfig já existe, pulando.");
  }

  // Upsert XpActionConfig entries
  const actions = [
    {
      actionKey: "EVENT_CHECKIN",
      label: "Check-in no Evento",
      description: "XP ganho ao fazer check-in geral no evento",
      xpAmount: 200,
      icon: "🎫",
      category: "engagement",
    },
    {
      actionKey: "ACTIVITY_CHECKIN",
      label: "Check-in na Atividade",
      description: "XP ganho ao fazer check-in em uma atividade específica",
      xpAmount: 50,
      icon: "📋",
      category: "engagement",
    },
    {
      actionKey: "PROFILE_COMPLETED",
      label: "Perfil Completo",
      description: "XP ganho ao completar todas as informações do perfil",
      xpAmount: 150,
      icon: "👤",
      category: "profile",
    },
    {
      actionKey: "EVENT_REGISTRATION",
      label: "Inscrição no Evento",
      description: "XP ganho ao se inscrever em um evento",
      xpAmount: 100,
      icon: "📝",
      category: "engagement",
    },
    {
      actionKey: "FEEDBACK_SUBMITTED",
      label: "Avaliação de Atividade",
      description:
        "XP ganho ao avaliar uma atividade (máximo 1 por atividade)",
      xpAmount: 75,
      icon: "⭐",
      category: "engagement",
    },
    {
      actionKey: "RAFFLE_WINNER",
      label: "Ganhador de Sorteio",
      description: "XP ganho ao ser sorteado em um evento",
      xpAmount: 50,
      icon: "🎰",
      category: "engagement",
    },
    {
      actionKey: "FIRST_EVENT",
      label: "Primeiro Evento",
      description:
        "XP bônus ao fazer o primeiro check-in em qualquer evento",
      xpAmount: 300,
      icon: "🌟",
      category: "milestone",
    },
    {
      actionKey: "DAILY_LOGIN",
      label: "Login Diário",
      description: "XP ganho ao fazer login (1 vez por dia)",
      xpAmount: 25,
      icon: "📅",
      category: "engagement",
    },
    {
      actionKey: "SUBMISSION_CREATED",
      label: "Submissão Enviada",
      description:
        "XP ganho ao enviar uma submissão científica para um evento",
      xpAmount: 200,
      icon: "📄",
      category: "academic",
    },
  ];

  for (const action of actions) {
    await prisma.xpActionConfig.upsert({
      where: { actionKey: action.actionKey },
      update: {},
      create: action,
    });
  }

  console.log(`✅ XpActionConfig populada com ${actions.length} ações.`);

  await prisma.$disconnect();
  await pool.end();
}

seedGamification()
  .then(() => {
    console.log("🎮 Seed de gamificação concluído.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Erro no seed:", err);
    process.exit(1);
  });
