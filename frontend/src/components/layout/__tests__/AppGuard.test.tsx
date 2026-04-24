import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppGuard } from "../AppGuard";
import { useAuth } from "@/context/AuthContext";

const mockPush = vi.fn();

vi.mock("next/navigation", async (importActual) => {
  const actual = await importActual<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
    }),
  };
});

describe("AppGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra fallback de loading enquanto auth carrega", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <AppGuard allowedRoles={["ORGANIZER"]}>
        <div>Conteúdo privado</div>
      </AppGuard>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo privado")).not.toBeInTheDocument();
  });

  it("redireciona não autenticado para /auth/login", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <AppGuard allowedRoles={["ORGANIZER"]}>
        <div>Conteúdo privado</div>
      </AppGuard>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/login");
    });
    expect(screen.queryByText("Conteúdo privado")).not.toBeInTheDocument();
  });

  it("redireciona papel não autorizado para o fallback", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "1",
        name: "P",
        email: "p@e.com",
        role: "PARTICIPANT",
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <AppGuard allowedRoles={["ORGANIZER"]}>
        <div>Conteúdo privado</div>
      </AppGuard>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/login");
    });
    expect(screen.queryByText("Conteúdo privado")).not.toBeInTheDocument();
  });

  it("permite papel autorizado", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "1",
        name: "O",
        email: "o@e.com",
        role: "ORGANIZER",
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <AppGuard allowedRoles={["ORGANIZER"]}>
        <div>Conteúdo privado</div>
      </AppGuard>,
    );

    expect(screen.getByText("Conteúdo privado")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("permite PARTICIPANT com isSpeaker=true quando allowIfSpeaker=true", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "1",
        name: "P",
        email: "p@e.com",
        role: "PARTICIPANT",
        isSpeaker: true,
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <AppGuard allowedRoles={["SPEAKER"]} allowIfSpeaker>
        <div>Conteúdo do palestrante</div>
      </AppGuard>,
    );

    expect(screen.getByText("Conteúdo do palestrante")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
