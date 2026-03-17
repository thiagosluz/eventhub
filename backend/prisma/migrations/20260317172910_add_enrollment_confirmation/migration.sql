-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "confirmationDays" INTEGER,
ADD COLUMN     "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ActivityEnrollment" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'CONFIRMED';
