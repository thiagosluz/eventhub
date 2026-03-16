-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "requiresEnrollment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "typeId" TEXT;

-- AlterTable
ALTER TABLE "ActivitySpeaker" ADD COLUMN     "roleId" TEXT;

-- CreateTable
CREATE TABLE "ActivityType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ActivityType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakerRole" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SpeakerRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivityType_tenantId_name_key" ON "ActivityType"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakerRole_tenantId_name_key" ON "SpeakerRole"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "ActivityType" ADD CONSTRAINT "ActivityType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakerRole" ADD CONSTRAINT "SpeakerRole_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ActivityType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySpeaker" ADD CONSTRAINT "ActivitySpeaker_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SpeakerRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
