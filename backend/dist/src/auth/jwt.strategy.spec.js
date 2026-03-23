"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const jwt_strategy_1 = require("./jwt.strategy");
describe('JwtStrategy', () => {
    let strategy;
    beforeEach(async () => {
        process.env.JWT_SECRET = 'test-secret';
        const module = await testing_1.Test.createTestingModule({
            providers: [jwt_strategy_1.JwtStrategy],
        }).compile();
        strategy = module.get(jwt_strategy_1.JwtStrategy);
    });
    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });
    describe('validate', () => {
        it('should return the payload', async () => {
            const payload = {
                sub: 'user_id',
                email: 'test@example.com',
                tenantId: 'tenant_id',
                role: 'ADMIN',
            };
            const result = await strategy.validate(payload);
            expect(result).toEqual(payload);
        });
    });
    it('should throw error if JWT_SECRET is not set', () => {
        const originalSecret = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;
        expect(() => new jwt_strategy_1.JwtStrategy()).toThrow('JWT_SECRET is not set');
        process.env.JWT_SECRET = originalSecret;
    });
});
//# sourceMappingURL=jwt.strategy.spec.js.map