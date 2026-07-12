-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "autoScanEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoScanIntervalHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "lastAutoScanAt" TIMESTAMP(3);
