import { api } from "@/lib/api";

export interface GamificationConfig {
  id: string;
  dailyXpLimit: number;
  levelFormulaBase: number;
  levelFormulaExponent: number;
  spikeThreshold: number;
  spikeWindowMinutes: number;
  updatedAt: string;
  updatedById?: string;
}

export interface XpActionConfig {
  id: string;
  actionKey: string;
  label: string;
  description?: string;
  xpAmount: number;
  isActive: boolean;
  icon?: string;
  category: string;
  updatedAt: string;
}

export interface GamificationConfigResponse {
  config: GamificationConfig;
  actions: XpActionConfig[];
}

export interface LevelCurvePoint {
  level: number;
  xpRequired: number;
}

export const gamificationConfigService = {
  getConfig: async (): Promise<GamificationConfigResponse> => {
    return api.get<GamificationConfigResponse>("/admin/gamification/config");
  },

  updateConfig: async (
    data: Partial<Omit<GamificationConfig, "id" | "updatedAt" | "updatedById">>,
  ): Promise<GamificationConfig> => {
    return api.patch<GamificationConfig>("/admin/gamification/config", data);
  },

  updateAction: async (
    id: string,
    data: Partial<Pick<XpActionConfig, "xpAmount" | "isActive" | "label" | "description" | "icon">>,
  ): Promise<XpActionConfig> => {
    return api.patch<XpActionConfig>(`/admin/gamification/actions/${id}`, data);
  },

  simulateCurve: async (
    base: number,
    exponent: number,
    maxLevel = 20,
  ): Promise<LevelCurvePoint[]> => {
    return api.post<LevelCurvePoint[]>("/admin/gamification/simulate", {
      base,
      exponent,
      maxLevel,
    });
  },
};
