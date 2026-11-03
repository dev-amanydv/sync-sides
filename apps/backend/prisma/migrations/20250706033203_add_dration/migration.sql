-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "durationMs" INTEGER;

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "joinedAt" TIMESTAMP(3),
ADD COLUMN     "leftAt" TIMESTAMP(3);
