import { PrismaClient } from './src/generated/prisma';

async function main() {
  const prisma = new PrismaClient();
  try {
    const events = await prisma.event.findMany();
    console.log(JSON.stringify(events, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
