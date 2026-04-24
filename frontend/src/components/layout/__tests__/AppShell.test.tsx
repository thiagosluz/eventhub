import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { AppShell } from "../AppShell";
import { ThemeModeProvider } from "@/components/providers/ThemeModeProvider";
import { useAuth } from "@/context/AuthContext";

function renderShell(ui: ReactElement) {
  return render(<ThemeModeProvider>{ui}</ThemeModeProvider>);
}

describe("AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "1",
        name: "Jane",
        email: "jane@example.com",
        role: "ORGANIZER",
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });
  });

  it("renderiza sidebar, headerStart, headerCenter e children", () => {
    renderShell(
      <AppShell
        sidebar={<aside data-testid="sidebar">Nav</aside>}
        headerStart={<span>Título</span>}
        headerCenter={<span>Ação central</span>}
        roleLabel="Organizador"
      >
        <p>Conteúdo interno</p>
      </AppShell>,
    );

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Ação central")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo interno")).toBeInTheDocument();
  });

  it("mostra sino de notificações por padrão", () => {
    renderShell(
      <AppShell roleLabel="Organizador">
        <p>X</p>
      </AppShell>,
    );
    expect(
      screen.getByRole("button", { name: /Notificações/i }),
    ).toBeInTheDocument();
  });

  it("oculta sino quando showNotifications=false", () => {
    renderShell(
      <AppShell roleLabel="Monitor" showNotifications={false}>
        <p>X</p>
      </AppShell>,
    );
    expect(
      screen.queryByRole("button", { name: /Notificações/i }),
    ).not.toBeInTheDocument();
  });

  it("renderiza ProfileMenu com o roleLabel fornecido", () => {
    renderShell(
      <AppShell roleLabel="Super Admin">
        <p>X</p>
      </AppShell>,
    );
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });
});
