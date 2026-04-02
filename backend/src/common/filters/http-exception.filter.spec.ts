import { Test, TestingModule } from '@nestjs/testing';
import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, ArgumentsHost, HttpStatus } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch HttpException and return formatted response', () => {
    const mockStatus = HttpStatus.BAD_REQUEST;
    const mockResponse = {
      statusCode: mockStatus,
      message: 'Bad Request',
      error: 'Bad Request',
    };
    const exception = new HttpException(mockResponse, mockStatus);

    const mockJson = jest.fn();
    const mockStatusFn = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({
      status: mockStatusFn,
    });
    const mockGetRequest = jest.fn().mockReturnValue({
      url: '/test',
    });

    const host = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    expect(mockStatusFn).toHaveBeenCalledWith(mockStatus);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: mockStatus,
      timestamp: expect.any(String),
      path: '/test',
      message: 'Bad Request',
    });
  });

  it('should handle non-object exception responses', () => {
    const mockStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    const exception = new HttpException('Internal Server Error', mockStatus);

    const mockJson = jest.fn();
    const mockStatusFn = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({
      status: mockStatusFn,
    });
    const mockGetRequest = jest.fn().mockReturnValue({
      url: '/test',
    });

    const host = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith({
      statusCode: mockStatus,
      timestamp: expect.any(String),
      path: '/test',
      message: 'Internal Server Error',
    });
  });
});
