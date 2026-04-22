import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./Card";
import { Button } from "./Button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Evento de Verão</CardTitle>
        <CardDescription>150 inscritos · 3 dias restantes</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Um card limpo e reutilizável. Use para agrupar informações
          relacionadas em uma superfície elevada.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">Detalhes</Button>
        <Button size="sm">Editar</Button>
      </CardFooter>
    </Card>
  ),
};

export const Metric: Story = {
  render: () => (
    <Card className="w-[240px] p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Ingressos vendidos
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight">1.248</p>
      <p className="mt-1 text-xs text-primary">+12% vs. semana passada</p>
    </Card>
  ),
};
