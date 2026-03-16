import { Injectable } from '@nestjs/common';
import { Client as MinioClient } from 'minio';

@Injectable()
export class MinioService {
  private readonly client: MinioClient;

  constructor() {
    this.client = new MinioClient({
      endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
      port: Number(process.env.MINIO_PORT ?? 9000),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    });
  }

  async ensureBucket(bucket: string): Promise<void> {
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket, '');
    }

    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetBucketLocation', 's3:ListBucket'],
          Resource: [`arn:aws:s3:::${bucket}`],
        },
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };

    await this.client.setBucketPolicy(bucket, JSON.stringify(policy));
  }

  async uploadObject(params: {
    bucket: string;
    objectName: string;
    data: Buffer;
    contentType: string;
  }): Promise<string> {
    const { bucket, objectName, data, contentType } = params;

    await this.ensureBucket(bucket);

    await this.client.putObject(bucket, objectName, data, data.length, {
      'Content-Type': contentType,
    });

    const host =
      process.env.MINIO_PUBLIC_URL ??
      `http://localhost:${process.env.MINIO_PORT ?? 9000}`;

    return `${host}/${bucket}/${objectName}`;
  }
}

