-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "defaultLandingView" TEXT NOT NULL DEFAULT 'all',
ADD COLUMN     "defaultLandingCollectionId" TEXT;
