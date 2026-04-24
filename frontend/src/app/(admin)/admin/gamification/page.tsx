"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  gamificationConfigService,
  type GamificationConfig,
  type XpActionConfig,
  type LevelCurvePoint,
} from "@/services/gamification-config.service";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrophyIcon,
  BoltIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// ─── Presets ─────────────────────────────────────────────────
interface Preset {
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  config: {
    dailyXpLimit: number;
    levelFormulaBase: number;
    levelFormulaExponent: number;
    spikeThreshold: number;
    spikeWindowMinutes: number;
  };
  actions: Record<string, number>;
}

const PRESETS: Preset[] = [
  {
    name: "Casual",
    emoji: "🟢",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    config: {
      dailyXpLimit: 2000,
      levelFormulaBase: 300,
      levelFormulaExponent: 0.8,
      spikeThreshold: 1500,
      spikeWindowMinutes: 5,
    },
    actions: { 
      EVENT_CHECKIN: 300, 
      ACTIVITY_CHECKIN: 100, 
      PROFILE_COMPLETED: 200,
      EVENT_REGISTRATION: 150,
      FEEDBACK_SUBMITTED: 100,
      RAFFLE_WINNER: 100,
      FIRST_EVENT: 500,
      DAILY_LOGIN: 50,
      SUBMISSION_CREATED: 300
    },
  },
  {
    name: "Balanceado",
    emoji: "🟡",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    config: {
      dailyXpLimit: 1500,
      levelFormulaBase: 500,
      levelFormulaExponent: 0.6,
      spikeThreshold: 1000,
      spikeWindowMinutes: 5,
    },
    actions: { 
      EVENT_CHECKIN: 200, 
      ACTIVITY_CHECKIN: 50, 
      PROFILE_COMPLETED: 150,
      EVENT_REGISTRATION: 100,
      FEEDBACK_SUBMITTED: 75,
      RAFFLE_WINNER: 50,
      FIRST_EVENT: 300,
      DAILY_LOGIN: 25,
      SUBMISSION_CREATED: 200
    },
  },
  {
    name: "Hardcore",
    emoji: "🔴",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    config: {
      dailyXpLimit: 1000,
      levelFormulaBase: 800,
      levelFormulaExponent: 0.4,
      spikeThreshold: 800,
      spikeWindowMinutes: 5,
    },
    actions: { 
      EVENT_CHECKIN: 100, 
      ACTIVITY_CHECKIN: 30, 
      PROFILE_COMPLETED: 100,
      EVENT_REGISTRATION: 50,
      FEEDBACK_SUBMITTED: 25,
      RAFFLE_WINNER: 25,
      FIRST_EVENT: 150,
      DAILY_LOGIN: 10,
      SUBMISSION_CREATED: 100
    },
  },
];

// ─── Helpers ─────────────────────────────────────────────────
function detectPreset(
  config: { dailyXpLimit: number; levelFormulaBase: number; levelFormulaExponent: number },
  actions: XpActionConfig[],
): string {
  for (const preset of PRESETS) {
    const configMatch =
      config.dailyXpLimit === preset.config.dailyXpLimit &&
      config.levelFormulaBase === preset.config.levelFormulaBase &&
      Math.abs(config.levelFormulaExponent - preset.config.levelFormulaExponent) < 0.01;

    const actionsMatch = actions.every((a) => {
      const presetVal = preset.actions[a.actionKey];
      return presetVal !== undefined && a.xpAmount === presetVal;
    });

    if (configMatch && actionsMatch) return preset.name;
  }
  return "Personalizado";
}

function simulateLocally(base: number, exponent: number, maxLevel = 20) {
  const curve: LevelCurvePoint[] = [];
  for (let lvl = 1; lvl <= maxLevel; lvl++) {
    if (lvl === 1) {
      curve.push({ level: 1, xpRequired: 0 });
      continue;
    }
    const xp = Math.ceil(base * Math.pow(lvl - 1, 1 / exponent));
    curve.push({ level: lvl, xpRequired: xp });
  }
  return curve;
}

function getSuggestedReward(level: number): string {
  if (level === 2) return "Desbloqueio de Avatar Customizado";
  if (level === 5) return "Badge Bronze + Multiplicador 5%";
  if (level === 10) return "Badge Prata + Acesso VIP Sorteios";
  if (level === 15) return "Badge Ouro + Destaque no Leaderboard";
  if (level === 20) return "Certificado de Engajamento VIP";
  if (level > 20 && level % 5 === 0) return "Título Honorífico Secreto";
  return "-";
}

function estimateDays(
  eventXp: number,
  activityXp: number,
  activitiesPerDay: number,
  dailyLimit: number,
  targetXp: number,
): number {
  const dailyGain = Math.min(eventXp + activityXp * activitiesPerDay, dailyLimit);
  if (dailyGain <= 0) return Infinity;
  return Math.ceil(targetXp / dailyGain);
}

// ─── Page Component ──────────────────────────────────────────
export default function GamificationConfigPage() {
  const [config, setConfig] = useState<GamificationConfig | null>(null);
  const [actions, setActions] = useState<XpActionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable form state
  const [formConfig, setFormConfig] = useState({
    dailyXpLimit: 1500,
    levelFormulaBase: 500,
    levelFormulaExponent: 0.6,
    spikeThreshold: 1000,
    spikeWindowMinutes: 5,
  });
  const [formActions, setFormActions] = useState<Record<string, { xpAmount: number; isActive: boolean }>>({});

  // Simulator state
  const [simBase, setSimBase] = useState(500);
  const [simExponent, setSimExponent] = useState(0.6);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const { config: cfg, actions: acts } = await gamificationConfigService.getConfig();
      setConfig(cfg);
      setActions(acts);
      if (cfg) {
        setFormConfig({
          dailyXpLimit: cfg.dailyXpLimit,
          levelFormulaBase: cfg.levelFormulaBase,
          levelFormulaExponent: cfg.levelFormulaExponent,
          spikeThreshold: cfg.spikeThreshold,
          spikeWindowMinutes: cfg.spikeWindowMinutes,
        });
        setSimBase(cfg.levelFormulaBase);
        setSimExponent(cfg.levelFormulaExponent);
      }
      const actMap: Record<string, { xpAmount: number; isActive: boolean }> = {};
      for (const a of acts) {
        actMap[a.id] = { xpAmount: a.xpAmount, isActive: a.isActive };
      }
      setFormActions(actMap);
    } catch {
      setError("Erro ao carregar configuração de gamificação.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const activePreset = useMemo(() => {
    return detectPreset(formConfig, actions.map((a) => ({
      ...a,
      xpAmount: formActions[a.id]?.xpAmount ?? a.xpAmount,
    })));
  }, [formConfig, formActions, actions]);

  const simulatedCurve = useMemo(() => {
    return simulateLocally(simBase, simExponent, 50);
  }, [simBase, simExponent]);

  const applyPreset = (preset: Preset) => {
    setFormConfig({ ...preset.config });
    setSimBase(preset.config.levelFormulaBase);
    setSimExponent(preset.config.levelFormulaExponent);

    const newActions = { ...formActions };
    for (const action of actions) {
      const presetVal = preset.actions[action.actionKey];
      if (presetVal !== undefined && newActions[action.id]) {
        newActions[action.id] = { ...newActions[action.id], xpAmount: presetVal };
      }
    }
    setFormActions(newActions);
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      setError(null);

      await gamificationConfigService.updateConfig(formConfig);

      for (const action of actions) {
        const form = formActions[action.id];
        if (form && (form.xpAmount !== action.xpAmount || form.isActive !== action.isActive)) {
          await gamificationConfigService.updateAction(action.id, form);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadConfig();
    } catch {
      setError("Erro ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Scenario Calculation ──────────────────────────────────
  const eventXp = actions.find((a) => a.actionKey === "EVENT_CHECKIN");
  const activityXp = actions.find((a) => a.actionKey === "ACTIVITY_CHECKIN");
  const currentEventXp = eventXp ? (formActions[eventXp.id]?.xpAmount ?? eventXp.xpAmount) : 200;
  const currentActivityXp = activityXp ? (formActions[activityXp.id]?.xpAmount ?? activityXp.xpAmount) : 50;

  const maxXpInActions = Math.max(...actions.map((a) => formActions[a.id]?.xpAmount ?? a.xpAmount), 1);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <TrophyIcon className="w-8 h-8 text-yellow-500" />
            Balanceamento de Gamificação
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure pontuações, limites e a curva de progressão da plataforma.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
            activePreset === "Personalizado"
              ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
              : PRESETS.find((p) => p.name === activePreset)
                ? `${PRESETS.find((p) => p.name === activePreset)!.borderColor} ${PRESETS.find((p) => p.name === activePreset)!.bgColor} ${PRESETS.find((p) => p.name === activePreset)!.color}`
                : "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}>
            {activePreset === "Personalizado" ? "⚙️" : PRESETS.find((p) => p.name === activePreset)?.emoji} {activePreset}
          </span>
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : null}
            {saving ? "Salvando..." : saveSuccess ? "Salvo!" : "Salvar Tudo"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Section 1: Presets & Global Parameters */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-yellow-500" />
          Presets & Parâmetros Globais
        </h2>

        {/* Preset Buttons */}
        <div className="grid grid-cols-3 gap-4">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`p-4 rounded-xl border-2 transition-all text-left hover:scale-[1.02] ${
                activePreset === preset.name
                  ? `${preset.borderColor} ${preset.bgColor}`
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{preset.emoji}</span>
                <span className={`font-bold ${activePreset === preset.name ? preset.color : "text-gray-900 dark:text-gray-100"}`}>
                  {preset.name}
                </span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Base: {preset.config.levelFormulaBase} | Exp: {preset.config.levelFormulaExponent}</p>
                <p>Limite diário: {preset.config.dailyXpLimit} XP</p>
                <p>Check-in: {preset.actions.EVENT_CHECKIN} XP | Atividade: {preset.actions.ACTIVITY_CHECKIN} XP</p>
              </div>
            </button>
          ))}
        </div>

        {/* Global Config Fields */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Limite Diário de XP</label>
            <input
              type="number"
              value={formConfig.dailyXpLimit}
              onChange={(e) => setFormConfig({ ...formConfig, dailyXpLimit: Number(e.target.value) })}
              className="mt-2 w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
              min={100}
              max={10000}
            />
            <input
              type="range"
              value={formConfig.dailyXpLimit}
              onChange={(e) => setFormConfig({ ...formConfig, dailyXpLimit: Number(e.target.value) })}
              className="mt-2 w-full accent-yellow-500"
              min={500}
              max={5000}
              step={100}
            />
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Spike Alert (XP)</label>
            <input
              type="number"
              value={formConfig.spikeThreshold}
              onChange={(e) => setFormConfig({ ...formConfig, spikeThreshold: Number(e.target.value) })}
              className="mt-2 w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
              min={100}
              max={10000}
            />
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Janela do Spike (min)</label>
            <input
              type="number"
              value={formConfig.spikeWindowMinutes}
              onChange={(e) => setFormConfig({ ...formConfig, spikeWindowMinutes: Number(e.target.value) })}
              className="mt-2 w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
              min={1}
              max={60}
            />
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col justify-center items-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Última Atualização</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {config?.updatedAt
                ? new Date(config.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: XP Action Cards */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BoltIcon className="w-5 h-5 text-yellow-500" />
          Ações Gamificadas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action) => {
            const form = formActions[action.id];
            if (!form) return null;
            const proportion = (form.xpAmount / maxXpInActions) * 100;

            return (
              <div
                key={action.id}
                className={`bg-white dark:bg-gray-900 border rounded-xl p-5 transition-all ${
                  form.isActive ? "border-gray-200 dark:border-gray-800" : "border-red-500/30 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{action.icon || "⚡"}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{action.label}</p>
                      <p className="text-xs text-gray-500">{action.actionKey}</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setFormActions({
                        ...formActions,
                        [action.id]: { ...form, isActive: !form.isActive },
                      })
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      form.isActive ? "bg-emerald-500" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        form.isActive ? "left-6" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                {action.description && (
                  <p className="text-xs text-gray-500 mb-3">{action.description}</p>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    value={form.xpAmount}
                    onChange={(e) =>
                      setFormActions({
                        ...formActions,
                        [action.id]: { ...form, xpAmount: Math.max(0, Number(e.target.value)) },
                      })
                    }
                    className="w-24 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-900 dark:text-gray-100 font-bold text-center focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    min={0}
                    max={5000}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">XP</span>
                </div>

                {/* Proportion bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                  <div
                    className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${proportion}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Level Curve Simulator */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-yellow-500" />
          Simulador de Curva de Nível
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="flex-1">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  Base: <span className="text-yellow-400 font-bold">{simBase}</span>
                </label>
                <input
                  type="range"
                  value={simBase}
                  onChange={(e) => {
                    setSimBase(Number(e.target.value));
                    setFormConfig({ ...formConfig, levelFormulaBase: Number(e.target.value) });
                  }}
                  className="w-full accent-yellow-500"
                  min={100}
                  max={1000}
                  step={50}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  Expoente: <span className="text-yellow-400 font-bold">{simExponent.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  value={simExponent * 100}
                  onChange={(e) => {
                    const val = Number(e.target.value) / 100;
                    setSimExponent(val);
                    setFormConfig({ ...formConfig, levelFormulaExponent: val });
                  }}
                  className="w-full accent-yellow-500"
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={simulatedCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="level"
                  stroke="#9CA3AF"
                  fontSize={12}
                  label={{ value: "Nível", position: "insideBottom", offset: -5, fill: "#9CA3AF" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                  label={{ value: "XP necessário", angle: -90, position: "insideLeft", fill: "#9CA3AF" }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                  labelStyle={{ color: "#F3F4F6" }}
                  formatter={(value: any) => [`${Number(value || 0).toLocaleString("pt-BR")} XP`, "XP Necessário"]}
                  labelFormatter={(label) => `Nível ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="xpRequired"
                  stroke="#EAB308"
                  strokeWidth={3}
                  dot={{ fill: "#EAB308", r: 4 }}
                  activeDot={{ r: 6, fill: "#FACC15" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Reference Table + Scenario */}
          <div className="space-y-4">
            {/* Level Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 max-h-[280px] overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tabela de Referência</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs">
                    <th className="text-left pb-2">Nível</th>
                    <th className="text-right pb-2">XP Necessário</th>
                    <th className="text-right pb-2 hidden sm:table-cell">Vantagem Sugerida</th>
                  </tr>
                </thead>
                <tbody>
                  {simulatedCurve.map((point) => (
                    <tr key={point.level} className="border-t border-gray-200 dark:border-gray-800">
                      <td className="py-1.5 text-gray-700 dark:text-gray-300 font-medium">
                        {point.level <= 3 ? "⭐" : point.level <= 10 ? "🌟" : "💎"} Nível {point.level}
                      </td>
                      <td className="py-1.5 text-right text-gray-600 dark:text-gray-400">
                        {point.xpRequired.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-1.5 text-right text-emerald-400/80 text-xs hidden sm:table-cell">
                        {getSuggestedReward(point.level)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Practical Scenario */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📊 Cenário Prático</h3>
              <p className="text-xs text-gray-500 mb-3">
                Participante médio: 1 check-in evento + 3 atividades/dia
              </p>
              <div className="space-y-2">
                {[5, 10, 20, 30, 40, 50].map((lvl) => {
                  const target = simulatedCurve.find((p) => p.level === lvl);
                  if (!target) return null;
                  const days = estimateDays(
                    currentEventXp,
                    currentActivityXp,
                    3,
                    formConfig.dailyXpLimit,
                    target.xpRequired,
                  );
                  return (
                    <div key={lvl} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Nível {lvl}</span>
                      <span className="text-sm font-bold text-yellow-400">
                        ~{days === Infinity ? "∞" : days} {days === 1 ? "dia" : "dias"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Avatar Tiers (Estética) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🎨 Tiers de Avatar (Estética)</h3>
              <p className="text-xs text-gray-500 mb-3">
                O avatar do usuário reage visualmente (ganhando bordas e efeitos) baseado exclusivamente no Nível alcançado:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center"><span className="text-gray-700 dark:text-gray-300">Nível 1 a 9</span><span className="font-bold text-gray-600 dark:text-gray-400">Básico</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-700 dark:text-gray-300">Nível 10 a 19</span><span className="font-bold text-amber-700">Bronze</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-700 dark:text-gray-300">Nível 20 a 29</span><span className="font-bold text-gray-700 dark:text-gray-300">Silver</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-700 dark:text-gray-300">Nível 30 a 39</span><span className="font-bold text-yellow-400">Gold</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-700 dark:text-gray-300">Nível 40 a 49</span><span className="font-bold text-cyan-200">Platinum</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-700 dark:text-gray-300">Nível 50+</span><span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-pulse">Legendary</span></div>
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
