/*
  Warnings:

  - You are about to drop the column `status` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `uploaded` on the `Meeting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "status",
DROP COLUMN "uploaded",
ADD COLUMN     "recorded" BOOLEAN NOT NULL DEFAULT false;
