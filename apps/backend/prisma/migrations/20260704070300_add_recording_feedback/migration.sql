-- CreateTable
CREATE TABLE "Recording" (
    "id" SERIAL NOT NULL,
    "meetingNoId" INTEGER NOT NULL,
    "status" "RecordingStatus" NOT NULL DEFAULT 'recording',
    "url" TEXT,
    "durationMs" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "meetingNoId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recording_meetingNoId_key" ON "Recording"("meetingNoId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_userId_meetingNoId_key" ON "Feedback"("userId", "meetingNoId");

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_meetingNoId_fkey" FOREIGN KEY ("meetingNoId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_meetingNoId_fkey" FOREIGN KEY ("meetingNoId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
