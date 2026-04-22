import * as Sentry from "@sentry/node";
import { captureException, initSentry, isSentryEnabled } from "./sentry";

jest.mock("@sentry/node", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

jest.mock("@sentry/profiling-node", () => ({
  nodeProfilingIntegration: jest.fn(() => ({})),
}));

describe("sentry helper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SENTRY_DSN;
  });

  it("stays disabled when DSN is missing", () => {
    initSentry();
    expect(isSentryEnabled()).toBe(false);
    captureException(new Error("boom"));
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("initializes and captures exceptions when DSN is set", () => {
    process.env.SENTRY_DSN = "https://example@o0.ingest.sentry.io/0";
    initSentry();
    expect(isSentryEnabled()).toBe(true);
    expect(Sentry.init).toHaveBeenCalled();

    captureException(new Error("boom"), { foo: "bar" });
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ extra: { foo: "bar" } }),
    );
  });
});
