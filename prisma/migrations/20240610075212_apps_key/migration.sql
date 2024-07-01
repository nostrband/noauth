/*
  Warnings:

  - The primary key for the `Apps` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Apps" (
    "appNpub" TEXT NOT NULL,
    "npub" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "jsonData" TEXT NOT NULL,

    PRIMARY KEY ("appNpub", "npub")
);
INSERT INTO "new_Apps" ("appNpub", "jsonData", "name", "npub", "timestamp") SELECT "appNpub", "jsonData", "name", "npub", "timestamp" FROM "Apps";
DROP TABLE "Apps";
ALTER TABLE "new_Apps" RENAME TO "Apps";
PRAGMA foreign_key_check("Apps");
PRAGMA foreign_keys=ON;
