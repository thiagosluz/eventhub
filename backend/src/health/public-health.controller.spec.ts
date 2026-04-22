import { PublicHealthController } from "./public-health.controller";

describe("PublicHealthController", () => {
  it("returns ok status and ISO timestamp", () => {
    const controller = new PublicHealthController();
    const result = controller.check();
    expect(result.status).toBe("ok");
    expect(new Date(result.timestamp).toString()).not.toBe("Invalid Date");
  });
});
