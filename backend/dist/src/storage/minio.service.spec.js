"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const minio_service_1 = require("./minio.service");
jest.mock('minio');
describe('MinioService', () => {
    let service;
    let mockClient;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [minio_service_1.MinioService],
        }).compile();
        service = module.get(minio_service_1.MinioService);
        mockClient = service.client;
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('ensureBucket', () => {
        it('should create bucket if it does not exist', async () => {
            mockClient.bucketExists.mockResolvedValue(false);
            mockClient.makeBucket.mockResolvedValue(undefined);
            mockClient.setBucketPolicy.mockResolvedValue(undefined);
            await service.ensureBucket('test-bucket');
            expect(mockClient.makeBucket).toHaveBeenCalledWith('test-bucket', '');
            expect(mockClient.setBucketPolicy).toHaveBeenCalled();
        });
        it('should not create bucket if it already exists', async () => {
            mockClient.bucketExists.mockResolvedValue(true);
            mockClient.setBucketPolicy.mockResolvedValue(undefined);
            await service.ensureBucket('test-bucket');
            expect(mockClient.makeBucket).not.toHaveBeenCalled();
        });
    });
    describe('uploadObject', () => {
        it('should upload object and return URL', async () => {
            mockClient.bucketExists.mockResolvedValue(true);
            mockClient.putObject.mockResolvedValue({ etag: '123' });
            mockClient.setBucketPolicy.mockResolvedValue(undefined);
            const params = {
                bucket: 'test-bucket',
                objectName: 'test.txt',
                data: Buffer.from('hello'),
                contentType: 'text/plain',
            };
            const url = await service.uploadObject(params);
            expect(mockClient.putObject).toHaveBeenCalled();
            expect(url).toContain('test-bucket/test.txt');
        });
    });
});
//# sourceMappingURL=minio.service.spec.js.map