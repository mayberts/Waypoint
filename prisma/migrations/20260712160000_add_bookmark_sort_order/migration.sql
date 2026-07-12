-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "sort" TEXT NOT NULL DEFAULT 'manual';

-- AlterTable
ALTER TABLE "Bookmark" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
