import { render, screen, fireEvent } from "@testing-library/react";
import { AvatarWithBorder } from "../AvatarWithBorder";
import { vi, describe, it, expect } from "vitest";

// Mock do Next/Image
vi.mock("next/image", () => ({
  default: ({ src, alt, fill, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe("AvatarWithBorder Component", () => {
  const defaultProps = {
    name: "Thiago Silva",
    level: 5,
  };

  it("deve renderizar as iniciais se não houver avatarUrl", () => {
    render(<AvatarWithBorder {...defaultProps} />);
    // substring(0, 2) de "Thiago Silva" é "Th"
    expect(screen.getByText(/Th/i)).toBeInTheDocument();
  });

  it("deve renderizar a imagem se houver avatarUrl", () => {
    render(<AvatarWithBorder {...defaultProps} avatarUrl="/avatar.png" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/avatar.png");
  });

  it("deve exibir o nível correto no badge", () => {
    render(<AvatarWithBorder {...defaultProps} level={42} />);
    expect(screen.getByText("Lvl 42")).toBeInTheDocument();
  });

  it("deve aplicar classe legendary para nível 50", () => {
    const { container } = render(<AvatarWithBorder {...defaultProps} level={50} />);
    const avatarWrapper = container.querySelector(".border-transparent");
    expect(avatarWrapper).toBeInTheDocument();
  });

  it("deve aplicar classe platinum para nível 40", () => {
    const { container } = render(<AvatarWithBorder {...defaultProps} level={40} />);
    expect(container.querySelector(".border-\\[\\#E5E4E2\\]")).toBeInTheDocument();
  });

  it("deve aplicar classe gold para nível 30", () => {
    const { container } = render(<AvatarWithBorder {...defaultProps} level={30} />);
    expect(container.querySelector(".border-\\[\\#FFD700\\]")).toBeInTheDocument();
  });

  it("deve permitir upload de imagem quando editable for true", () => {
    const onAvatarChangeMock = vi.fn();
    render(<AvatarWithBorder {...defaultProps} editable={true} onAvatarChange={onAvatarChangeMock} />);
    
    // O input está escondido sob a label com ícone de câmera
    const input = screen.getByLabelText("", { selector: 'input[type="file"]' });
    const file = new File(["dummy content"], "photo.png", { type: "image/png" });
    
    fireEvent.change(input, { target: { files: [file] } });
    expect(onAvatarChangeMock).toHaveBeenCalled();
  });
});
