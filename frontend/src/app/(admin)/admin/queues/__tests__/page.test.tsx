import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const replaceMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

import AdminQueuesPage from "../page";

describe("(admin) AdminQueuesPage", () => {
  const originalApi = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApi;
  });

  it("exibe spinner enquanto auth está carregando", () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: true });
    const { container } = render(<AdminQueuesPage />);
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("redireciona para /dashboard quando usuário não é SUPER_ADMIN", async () => {
    useAuthMock.mockReturnValue({
      user: { role: "ORGANIZER" },
      isLoading: false,
    });

    render(<AdminQueuesPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    });
    expect(screen.getByText(/Acesso restrito/i)).toBeInTheDocument();
  });

  it("renderiza iframe e botão de nova aba com token injetado para SUPER_ADMIN", async () => {
    localStorage.setItem("eventhub_token", "super-token-123");
    useAuthMock.mockReturnValue({
      user: { role: "SUPER_ADMIN", name: "Root" },
      isLoading: false,
    });

    render(<AdminQueuesPage />);

    const iframe = await screen.findByTitle("Bull Board dashboard");
    expect(iframe).toHaveAttribute(
      "src",
      "http://api.test/admin/queues?token=super-token-123",
    );

    const link = screen.getByRole("link", { name: /Abrir em nova aba/i });
    expect(link).toHaveAttribute(
      "href",
      "http://api.test/admin/queues?token=super-token-123",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("faz encodeURIComponent em tokens com caracteres especiais", async () => {
    localStorage.setItem("eventhub_token", "a b/c+d");
    useAuthMock.mockReturnValue({
      user: { role: "SUPER_ADMIN" },
      isLoading: false,
    });

    render(<AdminQueuesPage />);

    const iframe = await screen.findByTitle("Bull Board dashboard");
    expect(iframe.getAttribute("src")).toContain(
      encodeURIComponent("a b/c+d"),
    );
  });
});
