-- AlterTable
ALTER TABLE "Bookmark" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Bookmark_deletedAt_idx" ON "Bookmark"("deletedAt");
