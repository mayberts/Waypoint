-- CreateTable
CREATE TABLE "IconAsset" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IconAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IconAsset_category_idx" ON "IconAsset"("category");
