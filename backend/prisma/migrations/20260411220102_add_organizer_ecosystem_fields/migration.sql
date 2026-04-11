-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "coverUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPublicProfile" BOOLEAN NOT NULL DEFAULT false;
