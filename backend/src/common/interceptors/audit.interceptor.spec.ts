import { Test, TestingModule } from "@nestjs/testing";
import { AuditInterceptor } from "./audit.interceptor";
import { Reflector } from "@nestjs/core";
import { AuditService } from "../../audit/audit.service";
import { ExecutionContext, CallHandler } from "@nestjs/common";
import { of } from "rxjs";

describe("AuditInterceptor", () => {
  let interceptor: AuditInterceptor;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockAuditService = {
    create: jest.fn().mockResolvedValue({ id: "log-1" }),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        method: "POST",
        body: { name: "New Event" },
        params: { eventId: "event-1" },
        user: { sub: "user-1" },
        ip: "127.0.0.1",
        headers: { "user-agent": "Jest" },
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn().mockReturnValue({ name: "EventsController" }),
  };

  const mockCallHandler: CallHandler = {
    handle: jest.fn().mockReturnValue(of({ success: true })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
        { provide: Reflector, useValue: mockReflector },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    interceptor = module.get<AuditInterceptor>(AuditInterceptor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  it("should audit POST mutations", (done) => {
    mockReflector.getAllAndOverride.mockReturnValue(null); // No explicit metadata

    interceptor
      .intercept(
        mockExecutionContext as unknown as ExecutionContext,
        mockCallHandler,
      )
      .subscribe(() => {
        expect(mockAuditService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: "user-1",
            action: "POST_EVENTS", // Auto-generated
            resource: "Events",
            eventId: "event-1",
          }),
        );
        done();
      });
  });

  it("should use explicit metadata if provided", (done) => {
    mockReflector.getAllAndOverride.mockReturnValue({
      action: "CUSTOM_ACTION",
      resource: "CustomResource",
    });

    interceptor
      .intercept(
        mockExecutionContext as unknown as ExecutionContext,
        mockCallHandler,
      )
      .subscribe(() => {
        expect(mockAuditService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            action: "CUSTOM_ACTION",
            resource: "CustomResource",
          }),
        );
        done();
      });
  });

  it("should sanitize sensitive fields in payload", (done) => {
    const contextWithSensitiveData = {
      ...mockExecutionContext,
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: "POST",
          body: { name: "Event", password: "secret123", token: "abc-def" },
          params: { eventId: "event-1" },
          user: { sub: "user-1" },
          ip: "127.0.0.1",
          headers: {},
        }),
      }),
    };

    interceptor
      .intercept(
        contextWithSensitiveData as unknown as ExecutionContext,
        mockCallHandler,
      )
      .subscribe(() => {
        expect(mockAuditService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: {
              name: "Event",
              password: "********",
              token: "********",
            },
          }),
        );
        done();
      });
  });

  it("should skip GET methods without audit metadata", () => {
    const getContext = {
      ...mockExecutionContext,
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: "GET",
          user: { sub: "user-1" },
        }),
      }),
    };
    mockReflector.getAllAndOverride.mockReturnValue(null);

    interceptor.intercept(
      getContext as unknown as ExecutionContext,
      mockCallHandler,
    );
    expect(mockAuditService.create).not.toHaveBeenCalled();
  });
});
