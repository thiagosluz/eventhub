import { Test, TestingModule } from '@nestjs/testing';
import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log request details and execution time', (done) => {
    const mockRequest = {
      method: 'GET',
      url: '/test',
    };
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of('response')),
    } as CallHandler;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('GET /test'),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('ms'),
        );
        consoleSpy.mockRestore();
        done();
      },
    });
  });
});
