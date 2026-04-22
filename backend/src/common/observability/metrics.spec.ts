import { isMetricsEnabled, registerPrometheus } from "./metrics";

describe("isMetricsEnabled", () => {
  const original = process.env.ENABLE_METRICS;
  afterEach(() => {
    process.env.ENABLE_METRICS = original;
  });

  it("returns false by default", () => {
    delete process.env.ENABLE_METRICS;
    expect(isMetricsEnabled()).toBe(false);
  });

  it("returns true when env is 'true'", () => {
    process.env.ENABLE_METRICS = "true";
    expect(isMetricsEnabled()).toBe(true);
  });

  it("is case-insensitive", () => {
    process.env.ENABLE_METRICS = "TRUE";
    expect(isMetricsEnabled()).toBe(true);
  });
});

describe("registerPrometheus", () => {
  it("does nothing when metrics are disabled", () => {
    delete process.env.ENABLE_METRICS;
    const app = {
      getHttpAdapter: jest.fn(() => ({ getInstance: jest.fn() })),
    } as any;
    registerPrometheus(app);
    expect(app.getHttpAdapter).not.toHaveBeenCalled();
  });

  it("registers middleware and /metrics route when enabled", () => {
    process.env.ENABLE_METRICS = "true";
    const use = jest.fn();
    const get = jest.fn();
    const app = {
      getHttpAdapter: jest.fn(() => ({
        getInstance: jest.fn(() => ({ use, get })),
      })),
    } as any;
    registerPrometheus(app);
    expect(use).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/metrics", expect.any(Function));
    delete process.env.ENABLE_METRICS;
  });
});
