/*
  Warnings:

  - Added the required column `jsonData` to the `Perms` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Perms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npub" TEXT NOT NULL,
    "appNpub" TEXT NOT NULL,
    "perm" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "jsonData" TEXT NOT NULL
);
INSERT INTO "new_Perms" ("appNpub", "id", "npub", "perm", "timestamp", "value") SELECT "appNpub", "id", "npub", "perm", "timestamp", "value" FROM "Perms";
DROP TABLE "Perms";
ALTER TABLE "new_Perms" RENAME TO "Perms";
PRAGMA foreign_key_check("Perms");
PRAGMA foreign_keys=ON;
