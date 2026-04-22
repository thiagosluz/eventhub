import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UpdateTenantDto } from "./update-tenant.dto";

async function errorsFor(payload: unknown) {
  const instance = plainToInstance(UpdateTenantDto, payload);
  return validate(instance as object);
}

describe("UpdateTenantDto", () => {
  it("aceita payload vazio", async () => {
    expect(await errorsFor({})).toHaveLength(0);
  });

  it("aceita URLs válidas", async () => {
    const errors = await errorsFor({
      name: "Minha Org",
      bio: "Descrição",
      websiteUrl: "https://example.com",
      instagramUrl: "https://instagram.com/user",
      linkedinUrl: "https://linkedin.com/in/user",
      twitterUrl: "https://twitter.com/user",
      coverUrl: "http://localhost:9000/bucket/cover.png",
      logoUrl: "http://localhost:9000/bucket/logo.png",
    });
    expect(errors).toHaveLength(0);
  });

  it("trata strings vazias como ausentes (não rejeita @IsUrl)", async () => {
    const errors = await errorsFor({
      bio: "",
      websiteUrl: "",
      instagramUrl: "",
      linkedinUrl: "",
      twitterUrl: "",
      coverUrl: "",
    });
    expect(errors).toHaveLength(0);
  });

  it("rejeita URL inválida quando preenchida", async () => {
    const errors = await errorsFor({ websiteUrl: "ftp://::::" });
    expect(errors.map((e) => e.property)).toContain("websiteUrl");
  });

  it("aceita URLs locais sem TLD", async () => {
    const errors = await errorsFor({
      websiteUrl: "http://localhost:3001/org",
    });
    expect(errors).toHaveLength(0);
  });
});
