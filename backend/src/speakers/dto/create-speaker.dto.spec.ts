import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateSpeakerDto } from "./create-speaker.dto";
import { UpdateSpeakerDto } from "./update-speaker.dto";

async function errorsFor<T extends object>(
  Dto: new () => T,
  payload: unknown,
) {
  const instance = plainToInstance(Dto, payload);
  return validate(instance as object);
}

describe("Speaker DTOs", () => {
  describe("CreateSpeakerDto", () => {
    it("aceita apenas name (demais opcionais)", async () => {
      const errors = await errorsFor(CreateSpeakerDto, { name: "Ana" });
      expect(errors).toHaveLength(0);
    });

    it("aceita payload completo com URLs válidas", async () => {
      const errors = await errorsFor(CreateSpeakerDto, {
        name: "Ana",
        email: "ana@example.com",
        bio: "Bio",
        avatarUrl: "http://localhost:9000/bucket/a.png",
        linkedinUrl: "https://linkedin.com/in/ana",
        websiteUrl: "https://ana.dev",
      });
      expect(errors).toHaveLength(0);
    });

    it("normaliza strings vazias em URLs e email (não dispara @IsUrl/@IsEmail)", async () => {
      const errors = await errorsFor(CreateSpeakerDto, {
        name: "Ana",
        email: "",
        bio: "",
        avatarUrl: "",
        linkedinUrl: "",
        websiteUrl: "",
      });
      expect(errors).toHaveLength(0);
    });

    it("rejeita name ausente", async () => {
      const errors = await errorsFor(CreateSpeakerDto, {});
      expect(errors.map((e) => e.property)).toContain("name");
    });

    it("rejeita email inválido quando preenchido", async () => {
      const errors = await errorsFor(CreateSpeakerDto, {
        name: "Ana",
        email: "nao-e-email",
      });
      expect(errors.map((e) => e.property)).toContain("email");
    });
  });

  describe("UpdateSpeakerDto", () => {
    it("aceita payload vazio", async () => {
      const errors = await errorsFor(UpdateSpeakerDto, {});
      expect(errors).toHaveLength(0);
    });

    it("herda normalização de strings vazias do CreateSpeakerDto", async () => {
      const errors = await errorsFor(UpdateSpeakerDto, {
        avatarUrl: "",
        websiteUrl: "",
      });
      expect(errors).toHaveLength(0);
    });
  });
});
