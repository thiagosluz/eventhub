import { describe, expect, it } from "vitest";
import {
  calculateLevel,
  levelProgress,
  xpForLevel,
} from "@/lib/gamification/level";

describe("calculateLevel", () => {
  it("retorna nível 1 para XP zero ou negativo", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(-100)).toBe(1);
  });

  it("retorna nível 1 para valores não numéricos", () => {
    expect(calculateLevel(NaN)).toBe(1);
    expect(calculateLevel(Infinity)).toBe(1);
  });

  it("segue a fórmula oficial floor((xp/500)^0.6) + 1", () => {
    expect(calculateLevel(500)).toBe(2);
    expect(calculateLevel(1587)).toBe(2);
    expect(calculateLevel(1588)).toBe(3);
    expect(calculateLevel(3121)).toBe(4);
    expect(calculateLevel(5040)).toBe(5);
  });
});

describe("xpForLevel", () => {
  it("retorna 0 para nível 1 ou menor", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-5)).toBe(0);
  });

  it("bate com a inversa documentada em docs/gamificacao.md", () => {
    expect(xpForLevel(2)).toBe(500);
    expect(xpForLevel(3)).toBe(1588);
    expect(xpForLevel(4)).toBe(3121);
    expect(xpForLevel(5)).toBe(5040);
    expect(xpForLevel(10)).toBe(19471);
  });

  it("xpForLevel(calculateLevel(xp) + 1) é sempre > xp", () => {
    for (const xp of [0, 100, 500, 1587, 1588, 5039, 5040, 19470, 19471]) {
      const level = calculateLevel(xp);
      expect(xpForLevel(level + 1)).toBeGreaterThan(xp);
      expect(xpForLevel(level)).toBeLessThanOrEqual(xp);
    }
  });
});

describe("levelProgress", () => {
  it("nível 1 em 0 XP inicia no 0%", () => {
    const p = levelProgress(0);
    expect(p.level).toBe(1);
    expect(p.currentLevelXp).toBe(0);
    expect(p.nextLevelXp).toBe(500);
    expect(p.xpIntoLevel).toBe(0);
    expect(p.xpToNext).toBe(500);
    expect(p.progressPercent).toBe(0);
  });

  it("zera o progressPercent imediatamente após um level up", () => {
    const p = levelProgress(500);
    expect(p.level).toBe(2);
    expect(p.currentLevelXp).toBe(500);
    expect(p.xpIntoLevel).toBe(0);
    expect(p.progressPercent).toBe(0);
  });

  it("calcula o progresso no meio de um nível", () => {
    const p = levelProgress(1000);
    expect(p.level).toBe(2);
    expect(p.nextLevelXp).toBe(1588);
    expect(p.xpToNext).toBe(588);
    expect(p.progressPercent).toBeGreaterThan(0);
    expect(p.progressPercent).toBeLessThan(100);
  });

  it("progressPercent é monotônico dentro de um mesmo nível", () => {
    let previous = -1;
    for (let xp = 500; xp < 1588; xp += 50) {
      const p = levelProgress(xp);
      expect(p.level).toBe(2);
      expect(p.progressPercent).toBeGreaterThanOrEqual(previous);
      previous = p.progressPercent;
    }
  });

  it("percentual está sempre em [0, 100]", () => {
    for (const xp of [0, 100, 500, 1000, 5000, 10000, 50000, 500000]) {
      const p = levelProgress(xp);
      expect(p.progressPercent).toBeGreaterThanOrEqual(0);
      expect(p.progressPercent).toBeLessThanOrEqual(100);
    }
  });

  it("é tolerante a XP inválido (NaN)", () => {
    const p = levelProgress(NaN);
    expect(p.level).toBe(1);
    expect(p.progressPercent).toBe(0);
  });
});
