-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "colorScheme" TEXT NOT NULL DEFAULT 'dark',
ADD COLUMN     "density" TEXT NOT NULL DEFAULT 'comfortable',
ADD COLUMN     "gridPattern" TEXT NOT NULL DEFAULT 'none';
