import { describe, it, expect } from "vitest";
import { submissionSchema } from "../submissions";

function makeFile(
  name: string,
  type: string,
  sizeBytes: number,
): File {
  const buf = new ArrayBuffer(sizeBytes);
  return new File([buf], name, { type });
}

describe("submissionSchema", () => {
  const pdf = makeFile("paper.pdf", "application/pdf", 1024);

  it("accepts a valid submission", () => {
    const result = submissionSchema.safeParse({
      title: "Análise de performance distribuída",
      abstract: "Um resumo com o tamanho mínimo adequado para aceitar.",
      modalityId: "",
      thematicAreaId: "",
      file: pdf,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short title", () => {
    const result = submissionSchema.safeParse({
      title: "abc",
      abstract: "Um resumo com o tamanho mínimo adequado para aceitar.",
      modalityId: "",
      thematicAreaId: "",
      file: pdf,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a short abstract", () => {
    const result = submissionSchema.safeParse({
      title: "Análise de performance distribuída",
      abstract: "curto",
      modalityId: "",
      thematicAreaId: "",
      file: pdf,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-PDF file", () => {
    const docx = makeFile(
      "paper.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      1024,
    );
    const result = submissionSchema.safeParse({
      title: "Análise de performance distribuída",
      abstract: "Um resumo com o tamanho mínimo adequado para aceitar.",
      modalityId: "",
      thematicAreaId: "",
      file: docx,
    });
    expect(result.success).toBe(false);
  });

  it("rejects files over 10MB", () => {
    const big = makeFile("big.pdf", "application/pdf", 11 * 1024 * 1024);
    const result = submissionSchema.safeParse({
      title: "Análise de performance distribuída",
      abstract: "Um resumo com o tamanho mínimo adequado para aceitar.",
      modalityId: "",
      thematicAreaId: "",
      file: big,
    });
    expect(result.success).toBe(false);
  });

  it("requires a file", () => {
    const result = submissionSchema.safeParse({
      title: "Análise de performance distribuída",
      abstract: "Um resumo com o tamanho mínimo adequado para aceitar.",
      modalityId: "",
      thematicAreaId: "",
      file: null,
    });
    expect(result.success).toBe(false);
  });
});
