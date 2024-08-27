/*
  Warnings:

  - You are about to alter the column `timestamp` on the `History` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `BigInt`.
  - You are about to drop the column `jsonData` on the `Perms` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_History" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npub" TEXT NOT NULL,
    "appNpub" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "method" TEXT NOT NULL,
    "allowed" BOOLEAN,
    "jsonData" TEXT NOT NULL
);
INSERT INTO "new_History" ("allowed", "appNpub", "id", "jsonData", "method", "npub", "timestamp") SELECT "allowed", "appNpub", "id", "jsonData", "method", "npub", "timestamp" FROM "History";
DROP TABLE "History";
ALTER TABLE "new_History" RENAME TO "History";
CREATE INDEX "History_npub_appNpub_idx" ON "History"("npub", "appNpub");
CREATE TABLE "new_Perms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npub" TEXT NOT NULL,
    "appNpub" TEXT NOT NULL,
    "perm" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL
);
INSERT INTO "new_Perms" ("appNpub", "id", "npub", "perm", "timestamp", "value") SELECT "appNpub", "id", "npub", "perm", "timestamp", "value" FROM "Perms";
DROP TABLE "Perms";
ALTER TABLE "new_Perms" RENAME TO "Perms";
PRAGMA foreign_key_check("History");
PRAGMA foreign_key_check("Perms");
PRAGMA foreign_keys=ON;
