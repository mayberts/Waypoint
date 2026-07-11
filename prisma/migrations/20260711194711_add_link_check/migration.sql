-- AlterTable
ALTER TABLE "Bookmark" ADD COLUMN     "isBroken" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkCheckedAt" TIMESTAMP(3);
