import { Test, TestingModule } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { UserRole } from "./roles.types";
import { ExecutionContext } from "@nestjs/common";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should return true if no roles are required", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should return true if required roles list is empty", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([]);
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should return false if no user is present in request", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([UserRole.ORGANIZER]);
    const context = createMockContext(null);
    expect(guard.canActivate(context)).toBe(false);
  });

  it("should return false if user has no role", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([UserRole.ORGANIZER]);
    const context = createMockContext({});
    expect(guard.canActivate(context)).toBe(false);
  });

  it("should return false if user role does not match required roles", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([UserRole.ORGANIZER]);
    const context = createMockContext({ role: UserRole.PARTICIPANT });
    expect(guard.canActivate(context)).toBe(false);
  });

  it("should return true if user role matches one of the required roles", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([UserRole.ORGANIZER, UserRole.REVIEWER]);
    const context = createMockContext({ role: UserRole.ORGANIZER });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should return true if ORGANIZER has isSpeaker: true and accessing SPEAKER route", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([UserRole.SPEAKER]);
    const context = createMockContext({ 
      role: UserRole.ORGANIZER,
      isSpeaker: true 
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  function createMockContext(user: any = {}) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }
});
