import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateActivityDto } from "./create-activity.dto";
import { UpdateActivityDto } from "./update-activity.dto";

async function errorsFor<T extends object>(Dto: new () => T, payload: unknown) {
  const instance = plainToInstance(Dto, payload);
  return validate(instance as object);
}

describe("Activity DTOs", () => {
  const validPayload = {
    title: "Palestra de Abertura",
    description: "Descrição da palestra",
    location: "Auditório Principal",
    startAt: "2026-05-10T09:00:00.000Z",
    endAt: "2026-05-10T10:00:00.000Z",
    capacity: 100,
    typeId: "type-1",
    requiresEnrollment: true,
    requiresConfirmation: false,
    speakers: [{ speakerId: "spk-1", roleId: "role-1" }],
  };

  describe("CreateActivityDto", () => {
    it("aceita payload válido completo", async () => {
      const errors = await errorsFor(CreateActivityDto, validPayload);
      expect(errors).toHaveLength(0);
    });

    it("aceita payload mínimo (apenas obrigatórios)", async () => {
      const errors = await errorsFor(CreateActivityDto, {
        title: "Titulo",
        startAt: "2026-05-10T09:00:00.000Z",
        endAt: "2026-05-10T10:00:00.000Z",
      });
      expect(errors).toHaveLength(0);
    });

    it("rejeita title ausente", async () => {
      const errors = await errorsFor(CreateActivityDto, {
        startAt: "2026-05-10T09:00:00.000Z",
        endAt: "2026-05-10T10:00:00.000Z",
      });
      expect(errors.map((e) => e.property)).toContain("title");
    });

    it("rejeita startAt em formato inválido", async () => {
      const errors = await errorsFor(CreateActivityDto, {
        ...validPayload,
        startAt: "not-a-date",
      });
      expect(errors.map((e) => e.property)).toContain("startAt");
    });

    it("rejeita capacity negativa", async () => {
      const errors = await errorsFor(CreateActivityDto, {
        ...validPayload,
        capacity: 0,
      });
      expect(errors.map((e) => e.property)).toContain("capacity");
    });

    it("rejeita speaker sem speakerId", async () => {
      const errors = await errorsFor(CreateActivityDto, {
        ...validPayload,
        speakers: [{ speakerId: "", roleId: "role-1" }],
      });
      expect(errors.map((e) => e.property)).toContain("speakers");
    });
  });

  describe("UpdateActivityDto", () => {
    it("aceita payload vazio (todos os campos opcionais)", async () => {
      const errors = await errorsFor(UpdateActivityDto, {});
      expect(errors).toHaveLength(0);
    });

    it("aceita atualização parcial", async () => {
      const errors = await errorsFor(UpdateActivityDto, {
        title: "Novo título",
      });
      expect(errors).toHaveLength(0);
    });

    it("rejeita endAt com formato inválido", async () => {
      const errors = await errorsFor(UpdateActivityDto, {
        endAt: "xx",
      });
      expect(errors.map((e) => e.property)).toContain("endAt");
    });
  });
});
