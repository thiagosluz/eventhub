/*
  Warnings:

  - A unique constraint covering the columns `[userId,uniqueKey]` on the table `XpGainLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "XpGainLog" ADD COLUMN     "uniqueKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "XpGainLog_userId_uniqueKey_key" ON "XpGainLog"("userId", "uniqueKey");
