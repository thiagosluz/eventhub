import { BadRequestException } from "@nestjs/common";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { memoryStorage } from "multer";

const MB = 1024 * 1024;

export const IMAGE_MIME_WHITELIST = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];

export const DOCUMENT_MIME_WHITELIST = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
];

export const SUBMISSION_MIME_WHITELIST = [
  ...DOCUMENT_MIME_WHITELIST,
  "application/zip",
  "application/x-zip-compressed",
];

export interface UploadOptions {
  maxSizeMB: number;
  mimeWhitelist: readonly string[];
}

export function createUploadConfig(options: UploadOptions): MulterOptions {
  const { maxSizeMB, mimeWhitelist } = options;
  return {
    storage: memoryStorage(),
    limits: {
      fileSize: maxSizeMB * MB,
      files: 1,
    },
    fileFilter: (_req, file, cb) => {
      if (!mimeWhitelist.includes(file.mimetype)) {
        return cb(
          new BadRequestException(
            `Tipo de arquivo não permitido: ${file.mimetype}. Permitidos: ${mimeWhitelist.join(", ")}`,
          ),
          false,
        );
      }
      return cb(null, true);
    },
  };
}

export const imageUploadConfig = createUploadConfig({
  maxSizeMB: 5,
  mimeWhitelist: IMAGE_MIME_WHITELIST,
});

export const documentUploadConfig = createUploadConfig({
  maxSizeMB: 15,
  mimeWhitelist: DOCUMENT_MIME_WHITELIST,
});

export const submissionUploadConfig = createUploadConfig({
  maxSizeMB: 25,
  mimeWhitelist: SUBMISSION_MIME_WHITELIST,
});
