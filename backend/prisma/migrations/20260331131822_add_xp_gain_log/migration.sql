-- CreateTable
CREATE TABLE "XpGainLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpGainLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "XpGainLog_userId_createdAt_idx" ON "XpGainLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "XpGainLog" ADD CONSTRAINT "XpGainLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
