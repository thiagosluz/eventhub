import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL || "postgresql://eventhub:eventhub@localhost:5432/eventhub";
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const email = process.argv[2] || "participante@eventhub.com.br";
  const targetLevel = parseInt(process.argv[3], 10) || 50;

  // Formula: Level = floor((XP / 500)^0.6) + 1
  // Inverse: XP = 500 * (Level - 1)^(1/0.6)
  const xp = Math.ceil(500 * Math.pow(targetLevel - 1, 1 / 0.6));

  // Find a valid tenant first
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error("No tenant found in database!");
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      xp: xp,
      level: targetLevel,
    },
    create: {
      email,
      name: "Participante Simulado",
      password: "password123", // Doesn't matter for simulation
      role: "PARTICIPANT",
      tenantId: tenant.id,
      xp: xp,
      level: targetLevel,
      username: "participante_vanguard",
      publicProfile: true,
      profileTheme: "indigo",
      interests: ["Tech", "Design", "Gaming"]
    },
  });

  console.log(`✅ Sucesso! Usuário ${user.name} (${user.email})`);
  console.log(`Nível: ${user.level} | XP: ${user.xp}`);
  console.log(`\nAgora você pode logar com este email ou ver o perfil público em: /u/${user.username}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
