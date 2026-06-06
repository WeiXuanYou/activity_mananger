-- CreateTable
CREATE TABLE "AlbumPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploaderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "caption" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlbumPhoto_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AlbumPhoto_createdAt_idx" ON "AlbumPhoto"("createdAt");

-- CreateIndex
CREATE INDEX "AlbumPhoto_uploaderId_idx" ON "AlbumPhoto"("uploaderId");
