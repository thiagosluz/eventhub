import * as dotenv from 'dotenv';
dotenv.config();
import * as argon2 from 'argon2';
import { PrismaClient } from './src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL not set');
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({
    where: { email: 'admin@eventhub.com.br' }
  });

  if (user) {
    console.log('User found:', user.email);
    const isValid = await argon2.verify(user.password, '123456');
    console.log('Password "123456" is valid:', isValid);
  } else {
    console.log('User NOT found: admin@eventhub.com.br');
    const allUsers = await prisma.user.findMany();
    console.log('Total users in DB:', allUsers.length);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
