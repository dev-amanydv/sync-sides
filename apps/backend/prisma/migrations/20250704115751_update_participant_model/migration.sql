/*
  Warnings:

  - The primary key for the `Participant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `meetingId` on the `Participant` table. All the data in the column will be lost.
  - Added the required column `meetingNoId` to the `Participant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_meetingId_fkey";

-- AlterTable
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_pkey",
DROP COLUMN "meetingId",
ADD COLUMN     "meetingNoId" INTEGER NOT NULL,
ADD CONSTRAINT "Participant_pkey" PRIMARY KEY ("userId", "meetingNoId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_meetingNoId_fkey" FOREIGN KEY ("meetingNoId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
