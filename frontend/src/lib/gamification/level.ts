/**
 * Fórmula oficial de níveis (mantida em sincronia com o backend
 * `GamificationService.calculateLevel`):
 *
 *   Level = floor((XP / 500) ^ 0.6) + 1
 *
 * A inversa (XP mínimo para atingir um nível) é derivada de:
 *
 *   XP = 500 * (Level - 1) ^ (1 / 0.6)
 *
 * Qualquer alteração aqui DEVE ser refletida no backend
 * (`backend/src/gamification/gamification.service.ts`) e no script de
 * simulação (`backend/src/scripts/simulate-xp.ts`).
 */

const LEVEL_EXPONENT = 0.6;
const LEVEL_BASE = 500;

export function calculateLevel(xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) return 1;
  return Math.floor(Math.pow(xp / LEVEL_BASE, LEVEL_EXPONENT)) + 1;
}

/**
 * XP mínimo necessário para atingir `level`. Nível 1 corresponde a 0 XP.
 */
export function xpForLevel(level: number): number {
  if (!Number.isFinite(level) || level <= 1) return 0;
  return Math.ceil(LEVEL_BASE * Math.pow(level - 1, 1 / LEVEL_EXPONENT));
}

export interface LevelProgress {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpToNext: number;
  progressPercent: number;
}

/**
 * Retorna o progresso real do usuário dentro do nível atual, usando a
 * fórmula oficial. `progressPercent` está sempre em [0, 100] e zera após
 * cada level up.
 */
export function levelProgress(xp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  const level = calculateLevel(safeXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const span = Math.max(1, nextLevelXp - currentLevelXp);
  const xpIntoLevel = Math.max(0, safeXp - currentLevelXp);
  const xpToNext = Math.max(0, nextLevelXp - safeXp);
  const progressPercent = Math.min(100, Math.max(0, (xpIntoLevel / span) * 100));

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpToNext,
    progressPercent,
  };
}
