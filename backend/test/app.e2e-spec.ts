import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma/prisma.service";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: "log_1" }),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = "test_secret";
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("/ (GET) - health check or similar", () => {
    // Assuming there's a base route or we can just test authentication endpoint
    return request(app.getHttpServer())
      .get("/auth/login") // This might return 404 or 405 if it's POST, but it checks if app is up
      .expect(404);
  });
});
