const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const events = await prisma.event.findMany({
      select: { id: true, slug: true, status: true, name: true }
    });
    console.log('---EVENTS_DATA_START---');
    console.log(JSON.stringify(events, null, 2));
    console.log('---EVENTS_DATA_END---');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
