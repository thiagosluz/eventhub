import { MinioService } from "./minio.service";
import { MinioContainer, StartedMinioContainer } from "@testcontainers/minio";
import * as Minio from "minio";

describe("Storage Integration (Testcontainers)", () => {
  let container: StartedMinioContainer;
  let service: MinioService;
  let minioClient: Minio.Client;

  // Set timeout for container startup
  jest.setTimeout(60000);

  beforeAll(async () => {
    container = await new MinioContainer("minio/minio").start();

    minioClient = new Minio.Client({
      endPoint: container.getHost(),
      port: container.getMappedPort(9000),
      useSSL: false,
      accessKey: container.getUsername(),
      secretKey: container.getPassword(),
    });

    // Manually instance service to avoid full AppModule overhead for this demo
    service = new MinioService();
    // Inject mock-like but real client for testing
    (service as any).client = minioClient;
  });

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
  });

  it("should create a bucket and upload a file to a REAL MinIO container", async () => {
    const bucketName = "integration-test-bucket";
    const objectName = "test-file.txt";
    const content = Buffer.from("Hello from Testcontainers!");

    // 1. Ensure bucket
    await service.ensureBucket(bucketName);

    // 2. Upload using the correct object parameter
    await service.uploadObject({
      bucket: bucketName,
      objectName,
      data: content,
      contentType: "text/plain",
    });

    // 3. Verify via real client
    const stat = await minioClient.statObject(bucketName, objectName);
    expect(stat.size).toBe(content.length);

    // 4. Cleanup directly via client since Service doesn't have deleteObject yet
    await minioClient.removeObject(bucketName, objectName);
  });
});
