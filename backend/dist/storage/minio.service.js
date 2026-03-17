"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioService = void 0;
const common_1 = require("@nestjs/common");
const minio_1 = require("minio");
let MinioService = class MinioService {
    constructor() {
        var _a, _b, _c, _d;
        this.client = new minio_1.Client({
            endPoint: (_a = process.env.MINIO_ENDPOINT) !== null && _a !== void 0 ? _a : "localhost",
            port: Number((_b = process.env.MINIO_PORT) !== null && _b !== void 0 ? _b : 9000),
            useSSL: false,
            accessKey: (_c = process.env.MINIO_ACCESS_KEY) !== null && _c !== void 0 ? _c : "minioadmin",
            secretKey: (_d = process.env.MINIO_SECRET_KEY) !== null && _d !== void 0 ? _d : "minioadmin",
        });
    }
    async ensureBucket(bucket) {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
            await this.client.makeBucket(bucket, "");
        }
        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Action: ["s3:GetBucketLocation", "s3:ListBucket"],
                    Resource: [`arn:aws:s3:::${bucket}`],
                },
                {
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${bucket}/*`],
                },
            ],
        };
        await this.client.setBucketPolicy(bucket, JSON.stringify(policy));
    }
    async uploadObject(params) {
        var _a, _b;
        const { bucket, objectName, data, contentType } = params;
        await this.ensureBucket(bucket);
        await this.client.putObject(bucket, objectName, data, data.length, {
            "Content-Type": contentType,
        });
        const host = (_a = process.env.MINIO_PUBLIC_URL) !== null && _a !== void 0 ? _a : `http://localhost:${(_b = process.env.MINIO_PORT) !== null && _b !== void 0 ? _b : 9000}`;
        return `${host}/${bucket}/${objectName}`;
    }
};
exports.MinioService = MinioService;
exports.MinioService = MinioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MinioService);
//# sourceMappingURL=minio.service.js.map