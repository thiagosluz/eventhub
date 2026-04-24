import { describe, it, expect, vi, beforeEach } from "vitest";
import { gamificationConfigService } from "../gamification-config.service";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe("gamification-config.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getConfig", () => {
    it("should fetch gamification config", async () => {
      const mockResponse = {
        config: { id: "c1", dailyXpLimit: 1500 },
        actions: [{ id: "a1", actionKey: "EVENT_CHECKIN", xpAmount: 200 }],
      };
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await gamificationConfigService.getConfig();

      expect(api.get).toHaveBeenCalledWith("/admin/gamification/config");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("updateConfig", () => {
    it("should patch gamification config", async () => {
      const data = { dailyXpLimit: 2000 };
      const mockResponse = { id: "c1", dailyXpLimit: 2000 };
      vi.mocked(api.patch).mockResolvedValue(mockResponse);

      const result = await gamificationConfigService.updateConfig(data);

      expect(api.patch).toHaveBeenCalledWith(
        "/admin/gamification/config",
        data,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("updateAction", () => {
    it("should patch an xp action", async () => {
      const data = { xpAmount: 300, isActive: true };
      const mockResponse = { id: "a1", xpAmount: 300, isActive: true };
      vi.mocked(api.patch).mockResolvedValue(mockResponse);

      const result = await gamificationConfigService.updateAction("a1", data);

      expect(api.patch).toHaveBeenCalledWith(
        "/admin/gamification/actions/a1",
        data,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("simulateCurve", () => {
    it("should post simulation params and return curve", async () => {
      const mockCurve = [
        { level: 1, xpRequired: 0 },
        { level: 2, xpRequired: 500 },
      ];
      vi.mocked(api.post).mockResolvedValue(mockCurve);

      const result = await gamificationConfigService.simulateCurve(500, 0.6, 20);

      expect(api.post).toHaveBeenCalledWith(
        "/admin/gamification/simulate",
        { base: 500, exponent: 0.6, maxLevel: 20 },
      );
      expect(result).toEqual(mockCurve);
    });
  });
});
