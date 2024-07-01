/*
  Warnings:

  - Added the required column `ncryptsec` to the `Keys` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Keys" (
    "npub" TEXT NOT NULL PRIMARY KEY,
    "ncryptsec" TEXT NOT NULL,
    "jsonData" TEXT
);
INSERT INTO "new_Keys" ("jsonData", "npub") SELECT "jsonData", "npub" FROM "Keys";
DROP TABLE "Keys";
ALTER TABLE "new_Keys" RENAME TO "Keys";
PRAGMA foreign_key_check("Keys");
PRAGMA foreign_keys=ON;
