-- CreateEnum
CREATE TYPE "RaffleRule" AS ENUM ('ALL_REGISTERED', 'ONLY_CHECKED_IN');

-- CreateEnum
CREATE TYPE "BadgeTrigger" AS ENUM ('MANUAL', 'RAFFLE_WINNER', 'EARLY_BIRD', 'CHECKIN_STREAK', 'ACTIVITY_HOURS', 'EVENT_COUNT', 'PROFILE_COMPLETED');

-- CreateEnum
CREATE TYPE "ManualDeliveryMode" AS ENUM ('SCAN', 'UNIQUE_CODES', 'GLOBAL_CODE');

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_eventId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityEnrollment" DROP CONSTRAINT "ActivityEnrollment_activityId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityEnrollment" DROP CONSTRAINT "ActivityEnrollment_registrationId_fkey";

-- DropForeignKey
ALTER TABLE "ActivitySpeaker" DROP CONSTRAINT "ActivitySpeaker_activityId_fkey";

-- DropForeignKey
ALTER TABLE "ActivitySpeaker" DROP CONSTRAINT "ActivitySpeaker_speakerId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_activityId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "CertificateTemplate" DROP CONSTRAINT "CertificateTemplate_eventId_fkey";

-- DropForeignKey
ALTER TABLE "CustomForm" DROP CONSTRAINT "CustomForm_eventId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFormAnswer" DROP CONSTRAINT "CustomFormAnswer_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFormAnswer" DROP CONSTRAINT "CustomFormAnswer_responseId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFormField" DROP CONSTRAINT "CustomFormField_formId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFormResponse" DROP CONSTRAINT "CustomFormResponse_formId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFormResponse" DROP CONSTRAINT "CustomFormResponse_registrationId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFormResponse" DROP CONSTRAINT "CustomFormResponse_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "IssuedCertificate" DROP CONSTRAINT "IssuedCertificate_registrationId_fkey";

-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Sponsor" DROP CONSTRAINT "Sponsor_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "SponsorCategory" DROP CONSTRAINT "SponsorCategory_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_registrationId_fkey";

-- CreateTable
CREATE TABLE "RaffleHistory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "activityId" TEXT,
    "registrationId" TEXT NOT NULL,
    "prizeName" TEXT,
    "rule" "RaffleRule" NOT NULL DEFAULT 'ONLY_CHECKED_IN',
    "hasReceived" BOOLEAN NOT NULL DEFAULT false,
    "drawnAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaffleHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "triggerRule" "BadgeTrigger" NOT NULL DEFAULT 'MANUAL',
    "manualDeliveryMode" "ManualDeliveryMode" NOT NULL DEFAULT 'GLOBAL_CODE',
    "minRequirement" INTEGER DEFAULT 0,
    "claimCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeClaimCode" (
    "id" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BadgeClaimCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "eventId" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BadgeClaimCode_code_key" ON "BadgeClaimCode"("code");

-- CreateIndex
CREATE INDEX "BadgeClaimCode_badgeId_idx" ON "BadgeClaimCode"("badgeId");

-- CreateIndex
CREATE INDEX "BadgeClaimCode_code_idx" ON "BadgeClaimCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_eventId_key" ON "UserBadge"("userId", "badgeId", "eventId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySpeaker" ADD CONSTRAINT "ActivitySpeaker_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySpeaker" ADD CONSTRAINT "ActivitySpeaker_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Speaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEnrollment" ADD CONSTRAINT "ActivityEnrollment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEnrollment" ADD CONSTRAINT "ActivityEnrollment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomForm" ADD CONSTRAINT "CustomForm_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormField" ADD CONSTRAINT "CustomFormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormResponse" ADD CONSTRAINT "CustomFormResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormResponse" ADD CONSTRAINT "CustomFormResponse_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormResponse" ADD CONSTRAINT "CustomFormResponse_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormAnswer" ADD CONSTRAINT "CustomFormAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "CustomFormResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormAnswer" ADD CONSTRAINT "CustomFormAnswer_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomFormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateTemplate" ADD CONSTRAINT "CertificateTemplate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuedCertificate" ADD CONSTRAINT "IssuedCertificate_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorCategory" ADD CONSTRAINT "SponsorCategory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsor" ADD CONSTRAINT "Sponsor_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SponsorCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleHistory" ADD CONSTRAINT "RaffleHistory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleHistory" ADD CONSTRAINT "RaffleHistory_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleHistory" ADD CONSTRAINT "RaffleHistory_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeClaimCode" ADD CONSTRAINT "BadgeClaimCode_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeClaimCode" ADD CONSTRAINT "BadgeClaimCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
