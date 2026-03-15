"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const events = await prisma.event.findMany({
        select: { slug: true, status: true, name: true }
    });
    console.log('---EVENTS_DATA_START---');
    console.log(JSON.stringify(events, null, 2));
    console.log('---EVENTS_DATA_END---');
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=debug_db.js.map