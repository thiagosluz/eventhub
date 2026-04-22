import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  ThemeModeProvider,
  useThemeMode,
} from "../ThemeModeProvider";

function TestConsumer() {
  const { resolvedMode, toggle, setMode, mode } = useThemeMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolvedMode}</span>
      <button onClick={toggle}>toggle</button>
      <button onClick={() => setMode("dark")}>dark</button>
      <button onClick={() => setMode("light")}>light</button>
    </div>
  );
}

describe("ThemeModeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    window.matchMedia =
      window.matchMedia ||
      ((q: string) =>
        ({
          matches: false,
          media: q,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList);
  });

  it("throws when used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(/ThemeModeProvider/);
    spy.mockRestore();
  });

  it("applies dark class when setMode('dark') is called", () => {
    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>,
    );
    act(() => {
      screen.getByText("dark").click();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(window.localStorage.getItem("eventhub_theme_mode")).toBe("dark");
  });

  it("toggles between light and dark", () => {
    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>,
    );
    const toggleBtn = screen.getByText("toggle");
    act(() => toggleBtn.click());
    const first = screen.getByTestId("resolved").textContent;
    act(() => toggleBtn.click());
    const second = screen.getByTestId("resolved").textContent;
    expect(first).not.toBe(second);
  });
});
