"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    var _a;
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const corsOrigin = process.env.CORS_ORIGIN;
    const allowedOrigins = (corsOrigin === null || corsOrigin === void 0 ? void 0 : corsOrigin.length)
        ? corsOrigin.split(',').map((o) => o.trim())
        : ['http://localhost:3001', 'http://localhost:3000'];
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    await app.listen((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map