import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileMenu } from "../ProfileMenu";
import { useAuth } from "@/context/AuthContext";

describe("ProfileMenu", () => {
  const logout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "1",
        name: "Jane Doe",
        email: "jane@example.com",
        role: "ORGANIZER",
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout,
      updateUser: vi.fn(),
    });
  });

  it("renderiza nome e rótulo do papel", () => {
    render(<ProfileMenu roleLabel="Organizador" />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Organizador")).toBeInTheDocument();
  });

  it("abre dropdown ao clicar no botão", () => {
    render(
      <ProfileMenu
        roleLabel="Organizador"
        links={[{ href: "/dashboard/profile", label: "Meu Perfil" }]}
      />,
    );
    const btn = screen.getByRole("button", { name: /Abrir menu do usuário/i });
    expect(btn).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(btn);

    expect(btn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Meu Perfil/i })).toHaveAttribute(
      "href",
      "/dashboard/profile",
    );
    expect(
      screen.getByRole("menuitem", { name: /Sair do Sistema/i }),
    ).toBeInTheDocument();
  });

  it("chama logout ao clicar em 'Sair do Sistema'", () => {
    render(<ProfileMenu roleLabel="Organizador" />);
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu do usuário/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Sair do Sistema/i }));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("mostra e-mail do usuário no cabeçalho do dropdown", () => {
    render(<ProfileMenu roleLabel="Organizador" />);
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu do usuário/i }));
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("não renderiza nada se não houver usuário", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout,
      updateUser: vi.fn(),
    });
    const { container } = render(<ProfileMenu roleLabel="x" />);
    expect(container.firstChild).toBeNull();
  });
});
