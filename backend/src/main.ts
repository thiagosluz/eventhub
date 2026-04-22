import "dotenv/config";
import "reflect-metadata";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { PrismaClientExceptionFilter } from "./common/filters/prisma-client-exception.filter";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { CustomValidationPipe } from "./common/pipes/validation.pipe";
import { initSentry, isSentryEnabled } from "./common/observability/sentry";
import { registerPrometheus } from "./common/observability/metrics";

async function bootstrap() {
  initSentry();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN;
  const allowedOrigins = corsOrigin?.length
    ? corsOrigin.split(",").map((o) => o.trim())
    : ["http://localhost:3001", "http://localhost:3000"];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["x-request-id", "x-response-time"],
  });

  app.useGlobalPipes(new CustomValidationPipe());

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaClientExceptionFilter(httpAdapter),
  );

  registerPrometheus(app);

  const config = new DocumentBuilder()
    .setTitle("EventHub API")
    .setDescription("The API documentation for the EventHub platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, "0.0.0.0");

  const logger = app.get(Logger);
  logger.log(
    `EventHub API listening on :${port} (sentry=${isSentryEnabled() ? "on" : "off"})`,
    "Bootstrap",
  );
}

bootstrap();
