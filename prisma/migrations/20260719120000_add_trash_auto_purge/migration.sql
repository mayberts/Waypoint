-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "trashAutoPurgeEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "trashRetentionDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "lastTrashPurgeAt" TIMESTAMP(3),
ADD COLUMN     "lastTrashPurgeCount" INTEGER;
