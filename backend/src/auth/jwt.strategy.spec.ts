import { Test, TestingModule } from "@nestjs/testing";
import { JwtStrategy, JwtPayload } from "./jwt.strategy";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    process.env.JWT_SECRET = "test-secret";
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  describe("validate", () => {
    it("should return the payload", async () => {
      const payload: JwtPayload = {
        sub: "user_id",
        email: "test@example.com",
        tenantId: "tenant_id",
        role: "ADMIN",
      };

      const result = await strategy.validate(payload);
      expect(result).toEqual(payload);
    });
  });

  it("should throw error if JWT_SECRET is not set", () => {
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    expect(() => new JwtStrategy()).toThrow("JWT_SECRET is not set");
    process.env.JWT_SECRET = originalSecret;
  });
});
