"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const prisma_client_exception_filter_1 = require("./prisma-client-exception.filter");
const common_1 = require("@nestjs/common");
const prisma_1 = require("../../generated/prisma");
describe('PrismaClientExceptionFilter', () => {
    let filter;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [prisma_client_exception_filter_1.PrismaClientExceptionFilter],
        }).compile();
        filter = module.get(prisma_client_exception_filter_1.PrismaClientExceptionFilter);
    });
    it('should be defined', () => {
        expect(filter).toBeDefined();
    });
    it('should return 409 Conflict for P2002 error', () => {
        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        const mockArgumentsHost = {
            switchToHttp: () => ({
                getResponse: () => mockResponse,
            }),
        };
        const exception = new prisma_1.Prisma.PrismaClientKnownRequestError('Duplicate field', {
            code: 'P2002',
            clientVersion: '1.0',
        });
        filter.catch(exception, mockArgumentsHost);
        expect(mockResponse.status).toHaveBeenCalledWith(common_1.HttpStatus.CONFLICT);
        expect(mockResponse.json).toHaveBeenCalledWith({
            statusCode: common_1.HttpStatus.CONFLICT,
            message: 'Um item com este valor já existe.',
            error: 'Conflict',
        });
    });
    it('should return 404 Not Found for P2025 error', () => {
        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        const mockArgumentsHost = {
            switchToHttp: () => ({
                getResponse: () => mockResponse,
            }),
        };
        const exception = new prisma_1.Prisma.PrismaClientKnownRequestError('Not found', {
            code: 'P2025',
            clientVersion: '1.0',
        });
        filter.catch(exception, mockArgumentsHost);
        expect(mockResponse.status).toHaveBeenCalledWith(common_1.HttpStatus.NOT_FOUND);
        expect(mockResponse.json).toHaveBeenCalledWith({
            statusCode: common_1.HttpStatus.NOT_FOUND,
            message: 'Not found',
            error: 'Not Found',
        });
    });
});
//# sourceMappingURL=prisma-client-exception.filter.spec.js.map