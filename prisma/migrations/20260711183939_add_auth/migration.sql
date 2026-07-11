-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "authPasswordHash" TEXT,
ADD COLUMN     "authUsername" TEXT,
ADD COLUMN     "sessionSecret" TEXT;
