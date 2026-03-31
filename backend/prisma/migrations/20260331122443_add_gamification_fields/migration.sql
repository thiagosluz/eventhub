/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "profileTheme" TEXT DEFAULT 'zinc',
ADD COLUMN     "publicProfile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "username" TEXT,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
