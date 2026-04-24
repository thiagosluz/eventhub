import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LevelProgressBar } from "@/components/profile/LevelProgressBar";
import { levelProgress } from "@/lib/gamification/level";

function getFillWidth() {
  const fill = screen.getByTestId("level-progress-fill");
  return fill.getAttribute("style") ?? "";
}

describe("LevelProgressBar", () => {
  it("renderiza em 0% quando xp = 0 (nível 1)", () => {
    render(<LevelProgressBar xp={0} />);
    expect(getFillWidth()).toContain("width: 0%");
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(
      screen.getByText(/0 XP · 500 p\/ nv 2/i),
    ).toBeInTheDocument();
  });

  it("zera o preenchimento imediatamente após um level up (xp = 500)", () => {
    render(<LevelProgressBar xp={500} />);
    expect(getFillWidth()).toContain("width: 0%");
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("usa a fórmula oficial (levelProgress) e NÃO xp % 1000", () => {
    const xp = 1000;
    render(<LevelProgressBar xp={xp} />);

    const expected = levelProgress(xp);
    const style = getFillWidth();
    const match = style.match(/width:\s*([\d.]+)%/);
    expect(match).not.toBeNull();
    const actualPercent = parseFloat(match![1]);

    expect(Math.abs(actualPercent - expected.progressPercent)).toBeLessThan(
      0.001,
    );

    const naivePercent = Math.min(((xp % 1000) / 10), 100);
    expect(Math.abs(actualPercent - naivePercent)).toBeGreaterThan(1);
  });

  it("exibe o XP restante até o próximo nível no rótulo", () => {
    render(<LevelProgressBar xp={600} />);
    const progress = levelProgress(600);
    expect(
      screen.getByText(
        new RegExp(`${progress.xpToNext} p/ nv ${progress.level + 1}`, "i"),
      ),
    ).toBeInTheDocument();
  });
});
