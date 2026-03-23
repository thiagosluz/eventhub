"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const minio_service_1 = require("./minio.service");
const minio_1 = require("@testcontainers/minio");
const Minio = __importStar(require("minio"));
describe('Storage Integration (Testcontainers)', () => {
    let container;
    let service;
    let minioClient;
    jest.setTimeout(60000);
    beforeAll(async () => {
        container = await new minio_1.MinioContainer('minio/minio').start();
        minioClient = new Minio.Client({
            endPoint: container.getHost(),
            port: container.getMappedPort(9000),
            useSSL: false,
            accessKey: container.getUsername(),
            secretKey: container.getPassword(),
        });
        service = new minio_service_1.MinioService();
        service.client = minioClient;
    });
    afterAll(async () => {
        if (container) {
            await container.stop();
        }
    });
    it('should create a bucket and upload a file to a REAL MinIO container', async () => {
        const bucketName = 'integration-test-bucket';
        const objectName = 'test-file.txt';
        const content = Buffer.from('Hello from Testcontainers!');
        await service.ensureBucket(bucketName);
        await service.uploadObject({
            bucket: bucketName,
            objectName,
            data: content,
            contentType: 'text/plain'
        });
        const stat = await minioClient.statObject(bucketName, objectName);
        expect(stat.size).toBe(content.length);
        await minioClient.removeObject(bucketName, objectName);
    });
});
//# sourceMappingURL=storage-integration.spec.js.map