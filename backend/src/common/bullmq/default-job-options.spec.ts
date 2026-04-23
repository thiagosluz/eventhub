import { defaultJobOptions, QUEUE_NAMES } from "./default-job-options";

describe("BullMQ default job options", () => {
  it("retries 3 vezes com backoff exponencial", () => {
    expect(defaultJobOptions.attempts).toBe(3);
    expect(defaultJobOptions.backoff).toEqual({
      type: "exponential",
      delay: 2000,
    });
  });

  it("mantém janela de jobs concluídos/falhos para observabilidade", () => {
    expect(defaultJobOptions.removeOnComplete).toEqual({
      count: 100,
      age: 24 * 60 * 60,
    });
    expect(defaultJobOptions.removeOnFail).toEqual({
      count: 500,
      age: 7 * 24 * 60 * 60,
    });
  });

  it("lista todas as filas conhecidas do sistema", () => {
    expect(QUEUE_NAMES).toEqual([
      "assign-reviews",
      "activities",
      "emails",
      "kanban-alerts",
    ]);
  });
});
