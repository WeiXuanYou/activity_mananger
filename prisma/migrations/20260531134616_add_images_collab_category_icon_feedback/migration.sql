-- AlterTable
ALTER TABLE "Category" ADD COLUMN "iconImage" TEXT;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "image" TEXT;

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'OTHER',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "contact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "allowCollab" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomPage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CustomPage" ("cover", "createdAt", "excerpt", "id", "ownerId", "publishedAt", "slug", "title", "updatedAt", "visibility") SELECT "cover", "createdAt", "excerpt", "id", "ownerId", "publishedAt", "slug", "title", "updatedAt", "visibility" FROM "CustomPage";
DROP TABLE "CustomPage";
ALTER TABLE "new_CustomPage" RENAME TO "CustomPage";
CREATE UNIQUE INDEX "CustomPage_slug_key" ON "CustomPage"("slug");
CREATE TABLE "new_Lodging" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "pricePerNightCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'TWD',
    "url" TEXT,
    "rating" INTEGER,
    "addedById" TEXT NOT NULL,
    "allowCollab" BOOLEAN NOT NULL DEFAULT false,
    "stayedAt" DATETIME,
    "activityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lodging_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lodging_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lodging" ("activityId", "addedById", "address", "createdAt", "currency", "id", "name", "notes", "pricePerNightCents", "rating", "region", "stayedAt", "url") SELECT "activityId", "addedById", "address", "createdAt", "currency", "id", "name", "notes", "pricePerNightCents", "rating", "region", "stayedAt", "url" FROM "Lodging";
DROP TABLE "Lodging";
ALTER TABLE "new_Lodging" RENAME TO "Lodging";
CREATE INDEX "Lodging_region_idx" ON "Lodging"("region");
CREATE INDEX "Lodging_addedById_idx" ON "Lodging"("addedById");
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedById" TEXT,
    "hiddenAt" DATETIME,
    "bonus" TEXT,
    "bonusKind" TEXT,
    "bonusLimit" INTEGER,
    "images" TEXT,
    "allowCollab" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Post_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "body", "bonus", "bonusKind", "bonusLimit", "createdAt", "hiddenAt", "id", "isPinned", "kind", "pinnedById", "title", "visibility") SELECT "authorId", "body", "bonus", "bonusKind", "bonusLimit", "createdAt", "hiddenAt", "id", "isPinned", "kind", "pinnedById", "title", "visibility" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_isPinned_idx" ON "Post"("isPinned");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_authorId_idx" ON "Feedback"("authorId");
