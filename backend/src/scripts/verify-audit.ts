import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function testAudit() {
  console.log("--- Testing Audit Log Creation ---");

  // 1. Create a dummy log
  const log = await prisma.auditLog.create({
    data: {
      userId: "test-user", // This might fail if userId doesn't exist, I should check a valid user
      action: "TEST_ACTION",
      resource: "TestResource",
      payload: { message: "Hello Audit" },
    },
  });

  console.log("Created Audit Log:", log);

  // 2. Query logs
  const logs = await prisma.auditLog.findMany();
  console.log("Total Logs in DB:", logs.length);

  await prisma.$disconnect();
}

testAudit().catch(console.error);
