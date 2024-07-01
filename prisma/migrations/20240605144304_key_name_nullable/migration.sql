-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Keys" (
    "npub" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "ncryptsec" TEXT NOT NULL,
    "jsonData" TEXT
);
INSERT INTO "new_Keys" ("jsonData", "name", "ncryptsec", "npub") SELECT "jsonData", "name", "ncryptsec", "npub" FROM "Keys";
DROP TABLE "Keys";
ALTER TABLE "new_Keys" RENAME TO "Keys";
PRAGMA foreign_key_check("Keys");
PRAGMA foreign_keys=ON;
