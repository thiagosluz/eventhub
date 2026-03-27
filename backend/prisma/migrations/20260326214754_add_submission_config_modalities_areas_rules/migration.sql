-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "reviewEndDate" TIMESTAMP(3),
ADD COLUMN     "reviewStartDate" TIMESTAMP(3),
ADD COLUMN     "scientificCommitteeEmail" TEXT,
ADD COLUMN     "scientificCommitteeHead" TEXT,
ADD COLUMN     "submissionEndDate" TIMESTAMP(3),
ADD COLUMN     "submissionStartDate" TIMESTAMP(3),
ADD COLUMN     "submissionsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "modalityId" TEXT,
ADD COLUMN     "thematicAreaId" TEXT;

-- CreateTable
CREATE TABLE "SubmissionModality" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionModality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThematicArea" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThematicArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionRule" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionModality_eventId_name_key" ON "SubmissionModality"("eventId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ThematicArea_eventId_name_key" ON "ThematicArea"("eventId", "name");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "SubmissionModality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_thematicAreaId_fkey" FOREIGN KEY ("thematicAreaId") REFERENCES "ThematicArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionModality" ADD CONSTRAINT "SubmissionModality_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThematicArea" ADD CONSTRAINT "ThematicArea_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionRule" ADD CONSTRAINT "SubmissionRule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
