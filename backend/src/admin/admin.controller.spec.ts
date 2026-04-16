import { Test, TestingModule } from "@nestjs/testing";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

describe("AdminController", () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    listTenantUsers: jest.fn(),
    createTenant: jest.fn(),
    listTenants: jest.fn(),
    toggleTenantStatus: jest.fn(),
    getGlobalAuditLogs: jest.fn(),
    getGlobalStats: jest.fn(),
    impersonateUser: jest.fn(),
    listGlobalUsers: jest.fn(),
    updateGlobalUser: jest.fn(),
    resetGlobalUserPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: mockAdminService }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should list tenant users", async () => {
    await controller.listTenantUsers("t1");
    expect(service.listTenantUsers).toHaveBeenCalledWith("t1");
  });

  it("should create tenant", async () => {
    const dto = {
      name: "Tenant 1",
      slug: "t1",
      adminName: "name",
      adminEmail: "n@n.com",
      adminPassword: "abc",
    };
    await controller.createTenant(dto);
    expect(service.createTenant).toHaveBeenCalledWith(dto);
  });

  it("should list tenants", async () => {
    await controller.listTenants("1", "10");
    expect(service.listTenants).toHaveBeenCalledWith(1, 10);
  });

  it("should list tenants with default pagination", async () => {
    await controller.listTenants(undefined as any, undefined as any);
    expect(service.listTenants).toHaveBeenCalledWith(1, 10);
  });

  it("should toggle tenant status", async () => {
    await controller.toggleTenantStatus("t1", true);
    expect(service.toggleTenantStatus).toHaveBeenCalledWith("t1", true);
  });

  it("should get global audit logs", async () => {
    await controller.getGlobalAuditLogs(
      "1",
      "20",
      "t1",
      "u1",
      "action",
      "startDate",
      "endDate",
    );
    expect(service.getGlobalAuditLogs).toHaveBeenCalledWith(1, 20, {
      tenantId: "t1",
      userId: "u1",
      action: "action",
      startDate: "startDate",
      endDate: "endDate",
    });
  });

  it("should get global audit logs with default pagination", async () => {
    await controller.getGlobalAuditLogs(undefined as any, undefined as any);
    expect(service.getGlobalAuditLogs).toHaveBeenCalledWith(1, 20, {
      tenantId: undefined,
      userId: undefined,
      action: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  });

  it("should get global stats", async () => {
    await controller.getGlobalStats();
    expect(service.getGlobalStats).toHaveBeenCalled();
  });

  it("should impersonate user", async () => {
    const req = { user: { sub: "admin1" } };
    await controller.impersonateUser("targetUser", req);
    expect(service.impersonateUser).toHaveBeenCalledWith(
      "targetUser",
      "admin1",
    );
  });

  it("should list global users", async () => {
    await controller.listGlobalUsers("1", "20", "search", "ORGANIZER", "t1");
    expect(service.listGlobalUsers).toHaveBeenCalledWith(1, 20, {
      search: "search",
      role: "ORGANIZER",
      tenantId: "t1",
    });
  });

  it("should list global users with default params", async () => {
    await controller.listGlobalUsers(undefined as any, undefined as any);
    expect(service.listGlobalUsers).toHaveBeenCalledWith(1, 20, {
      search: undefined,
      role: undefined,
      tenantId: undefined,
    });
  });

  it("should update global user", async () => {
    const dto = { name: "New Name" };
    await controller.updateGlobalUser("u1", dto);
    expect(service.updateGlobalUser).toHaveBeenCalledWith("u1", dto);
  });

  it("should reset global user password", async () => {
    await controller.resetGlobalUserPassword("u1");
    expect(service.resetGlobalUserPassword).toHaveBeenCalledWith("u1");
  });
});
