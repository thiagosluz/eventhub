import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";
import { Queue, Worker } from "bullmq";

describe("Redis Integration (Testcontainers)", () => {
  let container: StartedRedisContainer;
  let redisConnection: any;

  // Set timeout for container startup
  jest.setTimeout(60000);

  beforeAll(async () => {
    container = await new RedisContainer("redis:latest").start();
    redisConnection = {
      host: container.getHost(),
      port: container.getMappedPort(6379),
    };
  });

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
  });

  it("should process a job using BullMQ and a REAL Redis container", async () => {
    const queueName = "test-queue";
    const myQueue = new Queue(queueName, { connection: redisConnection });

    let processedData = "";
    const worker = new Worker(
      queueName,
      async (job) => {
        processedData = job.data.foo;
      },
      { connection: redisConnection },
    );

    await myQueue.add("test-job", { foo: "bar" });

    // Wait for processing
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (processedData === "bar") {
          clearInterval(check);
          resolve(true);
        }
      }, 100);
    });

    expect(processedData).toBe("bar");

    await myQueue.close();
    await worker.close();
  });
});
