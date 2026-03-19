"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("./generated/prisma");
const prisma = new prisma_1.PrismaClient();
async function main() {
    const history = await prisma.raffleHistory.findMany({ include: { registration: { include: { user: true } } } });
    console.log("RaffleHistory:", JSON.stringify(history, null, 2));
    const userBadges = await prisma.userBadge.findMany({ include: { user: true, badge: true } });
    console.log("\nUserBadges:", JSON.stringify(userBadges, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=query.js.map