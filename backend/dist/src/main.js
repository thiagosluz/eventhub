"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const prisma_client_exception_filter_1 = require("./common/filters/prisma-client-exception.filter");
async function bootstrap() {
    var _a;
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const corsOrigin = process.env.CORS_ORIGIN;
    const allowedOrigins = (corsOrigin === null || corsOrigin === void 0 ? void 0 : corsOrigin.length)
        ? corsOrigin.split(",").map((o) => o.trim())
        : ["http://localhost:3001", "http://localhost:3000"];
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    });
    const { httpAdapter } = app.get(core_1.HttpAdapterHost);
    app.useGlobalFilters(new prisma_client_exception_filter_1.PrismaClientExceptionFilter(httpAdapter));
    const config = new swagger_1.DocumentBuilder()
        .setTitle("EventHub API")
        .setDescription("The API documentation for the EventHub platform")
        .setVersion("1.0")
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api/docs", app, document);
    await app.listen((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map