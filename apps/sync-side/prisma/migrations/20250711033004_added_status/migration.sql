-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('uploading', 'processing', 'available');

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "status" "RecordingStatus" NOT NULL DEFAULT 'uploading',
ADD COLUMN     "uploaded" BOOLEAN NOT NULL DEFAULT false;
