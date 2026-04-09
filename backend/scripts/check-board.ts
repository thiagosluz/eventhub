import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://eventhub:eventhub@localhost:5432/eventhub';
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const eventId = 'cmnolbwga0008ytuiwqmrwc11';
  console.log(`Checking event: ${eventId}`);
  
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      console.error('Event not found!');
    } else {
      console.log('Event found:', event.name);
    }
    
    const board = await prisma.kanbanBoard.findUnique({
      where: { eventId },
      include: { columns: true }
    });
    
    console.log('Board:', board ? 'Found' : 'Not Found');
    if (board) {
      console.log('Columns count:', board.columns.length);
    }
  } catch (err) {
    console.error('Database query failed:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
