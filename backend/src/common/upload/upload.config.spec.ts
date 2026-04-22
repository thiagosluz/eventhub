import { BadRequestException } from "@nestjs/common";
import {
  createUploadConfig,
  documentUploadConfig,
  imageUploadConfig,
  submissionUploadConfig,
  IMAGE_MIME_WHITELIST,
  DOCUMENT_MIME_WHITELIST,
  SUBMISSION_MIME_WHITELIST,
} from "./upload.config";

describe("upload.config", () => {
  describe("createUploadConfig", () => {
    const config = createUploadConfig({
      maxSizeMB: 2,
      mimeWhitelist: ["image/png"],
    });

    it("enforces file size limit in bytes", () => {
      expect(config.limits?.fileSize).toBe(2 * 1024 * 1024);
      expect(config.limits?.files).toBe(1);
    });

    it("accepts files with whitelisted mime types", (done) => {
      config.fileFilter?.(
        {} as any,
        { mimetype: "image/png" } as any,
        ((err: unknown, accepted: boolean | undefined) => {
          try {
            expect(err).toBeNull();
            expect(accepted).toBe(true);
            done();
          } catch (assertion) {
            done(assertion as Error);
          }
        }) as any,
      );
    });

    it("rejects files with non-whitelisted mime types", (done) => {
      config.fileFilter?.(
        {} as any,
        { mimetype: "application/x-msdownload" } as any,
        ((err: unknown) => {
          try {
            expect(err).toBeInstanceOf(BadRequestException);
            expect((err as BadRequestException).message).toContain(
              "application/x-msdownload",
            );
            done();
          } catch (assertion) {
            done(assertion as Error);
          }
        }) as any,
      );
    });
  });

  it("image preset exposes expected whitelist and limits", () => {
    expect(imageUploadConfig.limits?.fileSize).toBe(5 * 1024 * 1024);
    expect(IMAGE_MIME_WHITELIST).toContain("image/png");
    expect(IMAGE_MIME_WHITELIST).toContain("image/jpeg");
  });

  it("document preset exposes expected whitelist and limits", () => {
    expect(documentUploadConfig.limits?.fileSize).toBe(15 * 1024 * 1024);
    expect(DOCUMENT_MIME_WHITELIST).toContain("application/pdf");
  });

  it("submission preset is a superset of documents plus zip", () => {
    expect(submissionUploadConfig.limits?.fileSize).toBe(25 * 1024 * 1024);
    expect(SUBMISSION_MIME_WHITELIST).toContain("application/pdf");
    expect(SUBMISSION_MIME_WHITELIST).toContain("application/zip");
  });
});
