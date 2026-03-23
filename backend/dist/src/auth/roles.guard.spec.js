"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const core_1 = require("@nestjs/core");
const roles_guard_1 = require("./roles.guard");
const roles_types_1 = require("./roles.types");
describe('RolesGuard', () => {
    let guard;
    let reflector;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                roles_guard_1.RolesGuard,
                {
                    provide: core_1.Reflector,
                    useValue: {
                        getAllAndOverride: jest.fn(),
                    },
                },
            ],
        }).compile();
        guard = module.get(roles_guard_1.RolesGuard);
        reflector = module.get(core_1.Reflector);
    });
    it('should be defined', () => {
        expect(guard).toBeDefined();
    });
    it('should return true if no roles are required', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
        const context = createMockContext();
        expect(guard.canActivate(context)).toBe(true);
    });
    it('should return true if required roles list is empty', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
        const context = createMockContext();
        expect(guard.canActivate(context)).toBe(true);
    });
    it('should return false if no user is present in request', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([roles_types_1.UserRole.ORGANIZER]);
        const context = createMockContext(null);
        expect(guard.canActivate(context)).toBe(false);
    });
    it('should return false if user has no role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([roles_types_1.UserRole.ORGANIZER]);
        const context = createMockContext({});
        expect(guard.canActivate(context)).toBe(false);
    });
    it('should return false if user role does not match required roles', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([roles_types_1.UserRole.ORGANIZER]);
        const context = createMockContext({ role: roles_types_1.UserRole.PARTICIPANT });
        expect(guard.canActivate(context)).toBe(false);
    });
    it('should return true if user role matches one of the required roles', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([roles_types_1.UserRole.ORGANIZER, roles_types_1.UserRole.REVIEWER]);
        const context = createMockContext({ role: roles_types_1.UserRole.ORGANIZER });
        expect(guard.canActivate(context)).toBe(true);
    });
    function createMockContext(user = {}) {
        return {
            getHandler: () => ({}),
            getClass: () => ({}),
            switchToHttp: () => ({
                getRequest: () => ({ user }),
            }),
        };
    }
});
//# sourceMappingURL=roles.guard.spec.js.map