import "reflect-metadata";

process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.JWT_SECRET = "test_secret";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";
process.env.DATABASE_URL =
  "postgresql://eventhub:eventhub@localhost:5432/eventhub";
