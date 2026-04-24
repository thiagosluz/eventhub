import { describe, it, expect } from "vitest";
import { AREA_ROLES, ROLE_HOME, homeFor, labelFor } from "../roles";

describe("AREA_ROLES", () => {
  it("admin só aceita SUPER_ADMIN", () => {
    expect([...AREA_ROLES.admin]).toEqual(["SUPER_ADMIN"]);
  });

  it("dashboard aceita ORGANIZER e REVIEWER", () => {
    expect([...AREA_ROLES.dashboard].sort()).toEqual(
      ["ORGANIZER", "REVIEWER"].sort(),
    );
  });

  it("dashboard NÃO aceita SUPER_ADMIN nem PARTICIPANT", () => {
    expect(AREA_ROLES.dashboard).not.toContain("SUPER_ADMIN");
    expect(AREA_ROLES.dashboard).not.toContain("PARTICIPANT");
  });

  it("speaker aceita SPEAKER, ORGANIZER e SUPER_ADMIN", () => {
    expect([...AREA_ROLES.speaker].sort()).toEqual(
      ["ORGANIZER", "SPEAKER", "SUPER_ADMIN"].sort(),
    );
  });

  it("monitor aceita todos os papéis autenticados (verificação real é por evento no backend)", () => {
    expect(AREA_ROLES.monitor).toContain("PARTICIPANT");
    expect(AREA_ROLES.monitor).toContain("SPEAKER");
    expect(AREA_ROLES.monitor).toContain("REVIEWER");
    expect(AREA_ROLES.monitor).toContain("ORGANIZER");
    expect(AREA_ROLES.monitor).toContain("SUPER_ADMIN");
  });
});

describe("ROLE_HOME / homeFor", () => {
  it("mapeia cada papel para sua home", () => {
    expect(ROLE_HOME.SUPER_ADMIN).toBe("/admin/dashboard");
    expect(ROLE_HOME.ORGANIZER).toBe("/dashboard");
    expect(ROLE_HOME.REVIEWER).toBe("/dashboard");
    expect(ROLE_HOME.SPEAKER).toBe("/speaker");
    expect(ROLE_HOME.PARTICIPANT).toBe("/profile");
  });

  it("homeFor é equivalente a ROLE_HOME[role]", () => {
    expect(homeFor("SUPER_ADMIN")).toBe(ROLE_HOME.SUPER_ADMIN);
    expect(homeFor("ORGANIZER")).toBe(ROLE_HOME.ORGANIZER);
  });
});

describe("labelFor", () => {
  it("retorna rótulos humanos para cada papel", () => {
    expect(labelFor("SUPER_ADMIN")).toBe("Super Admin");
    expect(labelFor("ORGANIZER")).toBe("Organizador");
    expect(labelFor("REVIEWER")).toBe("Revisor");
    expect(labelFor("SPEAKER")).toBe("Palestrante");
    expect(labelFor("PARTICIPANT")).toBe("Participante");
  });
});
