import { Test, TestingModule } from "@nestjs/testing";
import { PrismaClientExceptionFilter } from "./prisma-client-exception.filter";
import { ArgumentsHost, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";

describe("PrismaClientExceptionFilter", () => {
  let filter: PrismaClientExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaClientExceptionFilter],
    }).compile();

    filter = module.get<PrismaClientExceptionFilter>(
      PrismaClientExceptionFilter,
    );
  });

  it("should be defined", () => {
    expect(filter).toBeDefined();
  });

  it("should return 409 Conflict for P2002 error", () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;

    const exception = new Prisma.PrismaClientKnownRequestError(
      "Duplicate field",
      {
        code: "P2002",
        clientVersion: "1.0",
      },
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: "Um item com este valor já existe.",
      error: "Conflict",
    });
  });

  it("should return 404 Not Found for P2025 error", () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;

    const exception = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "1.0",
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: "Not found",
      error: "Not Found",
    });
  });
});
