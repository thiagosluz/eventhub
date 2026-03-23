"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("@testcontainers/redis");
const bullmq_1 = require("bullmq");
describe('Redis Integration (Testcontainers)', () => {
    let container;
    let redisConnection;
    jest.setTimeout(60000);
    beforeAll(async () => {
        container = await new redis_1.RedisContainer('redis:latest').start();
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
    it('should process a job using BullMQ and a REAL Redis container', async () => {
        const queueName = 'test-queue';
        const myQueue = new bullmq_1.Queue(queueName, { connection: redisConnection });
        let processedData = '';
        const worker = new bullmq_1.Worker(queueName, async (job) => {
            processedData = job.data.foo;
        }, { connection: redisConnection });
        await myQueue.add('test-job', { foo: 'bar' });
        await new Promise((resolve) => {
            const check = setInterval(() => {
                if (processedData === 'bar') {
                    clearInterval(check);
                    resolve(true);
                }
            }, 100);
        });
        expect(processedData).toBe('bar');
        await myQueue.close();
        await worker.close();
    });
});
//# sourceMappingURL=redis-integration.spec.js.map