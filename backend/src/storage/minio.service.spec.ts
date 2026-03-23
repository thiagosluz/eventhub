import { Test, TestingModule } from "@nestjs/testing";
import { MinioService } from "./minio.service";
import { Client as MinioClient } from "minio";

jest.mock("minio");

describe("MinioService", () => {
  let service: MinioService;
  let mockClient: jest.Mocked<MinioClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MinioService],
    }).compile();

    service = module.get<MinioService>(MinioService);
    mockClient = (service as any).client;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("ensureBucket", () => {
    it("should create bucket if it does not exist", async () => {
      mockClient.bucketExists.mockResolvedValue(false);
      mockClient.makeBucket.mockResolvedValue(undefined as any);
      mockClient.setBucketPolicy.mockResolvedValue(undefined as any);

      await service.ensureBucket("test-bucket");

      expect(mockClient.makeBucket).toHaveBeenCalledWith("test-bucket", "");
      expect(mockClient.setBucketPolicy).toHaveBeenCalled();
    });

    it("should not create bucket if it already exists", async () => {
      mockClient.bucketExists.mockResolvedValue(true);
      mockClient.setBucketPolicy.mockResolvedValue(undefined as any);

      await service.ensureBucket("test-bucket");

      expect(mockClient.makeBucket).not.toHaveBeenCalled();
    });
  });

  describe("uploadObject", () => {
    it("should upload object and return URL", async () => {
      mockClient.bucketExists.mockResolvedValue(true);
      mockClient.putObject.mockResolvedValue({ etag: "123" } as any);
      mockClient.setBucketPolicy.mockResolvedValue(undefined as any);

      const params = {
        bucket: "test-bucket",
        objectName: "test.txt",
        data: Buffer.from("hello"),
        contentType: "text/plain",
      };

      const url = await service.uploadObject(params);

      expect(mockClient.putObject).toHaveBeenCalled();
      expect(url).toContain("test-bucket/test.txt");
    });
  });
});
