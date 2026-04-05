import { render, screen, fireEvent } from "@testing-library/react";
import { Badge3D } from "../Badge3D";
import { vi, describe, it, expect } from "vitest";

// Mock do @heroicons/react
vi.mock("@heroicons/react/24/outline", () => ({
  CheckBadgeIcon: (props: any) => <div {...props} data-testid="CheckBadgeIcon" />,
  LockClosedIcon: (props: any) => <div {...props} data-testid="LockClosedIcon" />,
}));

describe("Badge3D Component", () => {
  const defaultProps = {
    name: "Explorador",
    description: "Participou de 5 eventos",
    color: "purple",
    isEarned: true,
  };

  it("deve renderizar o nome e a raridade da medalha", () => {
    render(<Badge3D {...defaultProps} />);
    expect(screen.getByText("Explorador")).toBeInTheDocument();
    expect(screen.getByText("ÉPICA")).toBeInTheDocument();
  });

  it("deve renderizar ícone de cadeado quando não conquistada", () => {
    render(<Badge3D {...defaultProps} isEarned={false} />);
    expect(screen.getByTestId("LockClosedIcon")).toBeInTheDocument();
    expect(screen.getByText("MISTÉRIO")).toBeInTheDocument();
  });

  it("deve renderizar ícone customizado/emoji se fornecido", () => {
    render(<Badge3D {...defaultProps} iconUrl="🚀" />);
    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("deve chamar onClick ao interagir", () => {
    const onClickMock = vi.fn();
    render(<Badge3D {...defaultProps} onClick={onClickMock} />);
    
    fireEvent.click(screen.getByText("Explorador"));
    expect(onClickMock).toHaveBeenCalled();
  });

  it("deve reagir ao movimento do mouse (simular 3D effect)", () => {
    const { container } = render(<Badge3D {...defaultProps} />);
    const cardContainer = container.firstChild as HTMLElement;
    const innerCard = container.querySelector('div[style*="transform"]') as HTMLElement;

    // Simula MouseMove no centro do card
    fireEvent.mouseMove(cardContainer, { clientX: 200, clientY: 200 });

    // Verifica se o transform foi aplicado
    expect(innerCard.style.transform).toContain('rotateX');
    expect(innerCard.style.transform).toContain('rotateY');

    // Simula MouseLeave para resetar
    fireEvent.mouseLeave(cardContainer);
    expect(innerCard.style.transform).toContain('rotateX(0deg)');
    expect(innerCard.style.transform).toContain('rotateY(0deg)');
  });

  it("deve aplicar esquemas de cores corretos", () => {
    const { rerender } = render(<Badge3D {...defaultProps} color="gold" />);
    expect(screen.getByText("LENDÁRIA")).toBeInTheDocument();

    rerender(<Badge3D {...defaultProps} color="emerald" />);
    expect(screen.getByText("COMUM")).toBeInTheDocument();
  });

  it("deve exibir data de conquista se fornecida", () => {
    render(<Badge3D {...defaultProps} earnedAt="2024-10-10T10:00:00Z" />);
    expect(screen.getByText(/CONQUISTADO EM 10\/10\/2024/i)).toBeInTheDocument();
  });
});
