/*
  Warnings:

  - Added the required column `email` to the `PasswordReset` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Backfill the new NOT-NULL `email` column for any existing tokens by
-- joining to the owning User. Tokens for an email-less user (or a since-
-- deleted one) get "" — harmless, because consumption checks
-- `User.email === PasswordReset.email`, so a "" pin can never match a
-- real address and the stale token is simply un-redeemable (it would
-- have been GC'd / expired anyway). Without this COALESCE+subquery the
-- rebuild would throw a NOT-NULL violation on a populated table.
INSERT INTO "new_PasswordReset" ("createdAt", "expiresAt", "id", "tokenHash", "usedAt", "userId", "email")
SELECT pr."createdAt", pr."expiresAt", pr."id", pr."tokenHash", pr."usedAt", pr."userId",
       COALESCE((SELECT u."email" FROM "User" u WHERE u."id" = pr."userId"), '')
FROM "PasswordReset" pr;
DROP TABLE "PasswordReset";
ALTER TABLE "new_PasswordReset" RENAME TO "PasswordReset";
CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
