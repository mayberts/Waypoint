-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "shareSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Collection_shareSlug_key" ON "Collection"("shareSlug");
