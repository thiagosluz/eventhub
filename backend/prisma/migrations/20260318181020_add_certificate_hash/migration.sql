/*
  Warnings:

  - A unique constraint covering the columns `[validationHash]` on the table `IssuedCertificate` will be added. If there are existing duplicate values, this will fail.
  - The required column `validationHash` was added to the `IssuedCertificate` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "IssuedCertificate" ADD COLUMN     "validationHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "IssuedCertificate_validationHash_key" ON "IssuedCertificate"("validationHash");
