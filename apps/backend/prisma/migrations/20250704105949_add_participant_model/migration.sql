/*
  Warnings:

  - You are about to drop the `_MeetingParticipants` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_MeetingParticipants" DROP CONSTRAINT "_MeetingParticipants_A_fkey";

-- DropForeignKey
ALTER TABLE "_MeetingParticipants" DROP CONSTRAINT "_MeetingParticipants_B_fkey";

-- DropTable
DROP TABLE "_MeetingParticipants";

-- CreateTable
CREATE TABLE "Participant" (
    "userId" INTEGER NOT NULL,
    "meetingId" INTEGER NOT NULL,
    "hasJoined" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("userId","meetingId")
);

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
