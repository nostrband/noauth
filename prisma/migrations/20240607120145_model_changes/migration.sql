/*
  Warnings:

  - You are about to drop the column `icon` on the `Apps` table. All the data in the column will be lost.
  - You are about to drop the column `permUpdateTimestamp` on the `Apps` table. All the data in the column will be lost.
  - You are about to drop the column `subNpub` on the `Apps` table. All the data in the column will be lost.
  - You are about to drop the column `updateTimestamp` on the `Apps` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Apps` table. All the data in the column will be lost.
  - You are about to drop the column `jsonData` on the `SyncHistory` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Keys` table. All the data in the column will be lost.
  - You are about to drop the column `ncryptsec` on the `Keys` table. All the data in the column will be lost.
  - You are about to alter the column `timestamp` on the `History` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `DateTime`.
  - Added the required column `timestamp` to the `Apps` table without a default value. This is not possible if the table is not empty.
  - Made the column `jsonData` on table `Apps` required. This step will fail if there are existing NULL values in that column.
  - Made the column `jsonData` on table `Pending` required. This step will fail if there are existing NULL values in that column.
  - Made the column `jsonData` on table `ConnectTokens` required. This step will fail if there are existing NULL values in that column.
  - Made the column `jsonData` on table `Keys` required. This step will fail if there are existing NULL values in that column.
  - Made the column `jsonData` on table `History` required. This step will fail if there are existing NULL values in that column.
  - Made the column `jsonData` on table `Perms` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Apps" (
    "appNpub" TEXT NOT NULL PRIMARY KEY,
    "npub" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "jsonData" TEXT NOT NULL
);
INSERT INTO "new_Apps" ("appNpub", "jsonData", "name", "npub") SELECT "appNpub", "jsonData", "name", "npub" FROM "Apps";
DROP TABLE "Apps";
ALTER TABLE "new_Apps" RENAME TO "Apps";
CREATE TABLE "new_Pending" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npub" TEXT NOT NULL,
    "appNpub" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "method" TEXT NOT NULL,
    "jsonData" TEXT NOT NULL
);
INSERT INTO "new_Pending" ("appNpub", "id", "jsonData", "method", "npub", "timestamp") SELECT "appNpub", "id", "jsonData", "method", "npub", "timestamp" FROM "Pending";
DROP TABLE "Pending";
ALTER TABLE "new_Pending" RENAME TO "Pending";
CREATE TABLE "new_ConnectTokens" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "npub" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "expiry" BIGINT NOT NULL,
    "subNpub" TEXT,
    "jsonData" TEXT NOT NULL
);
INSERT INTO "new_ConnectTokens" ("expiry", "jsonData", "npub", "subNpub", "timestamp", "token") SELECT "expiry", "jsonData", "npub", "subNpub", "timestamp", "token" FROM "ConnectTokens";
DROP TABLE "ConnectTokens";
ALTER TABLE "new_ConnectTokens" RENAME TO "ConnectTokens";
CREATE INDEX "ConnectTokens_npub_subNpub_idx" ON "ConnectTokens"("npub", "subNpub");
CREATE TABLE "new_SyncHistory" (
    "npub" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "new_SyncHistory" ("npub") SELECT "npub" FROM "SyncHistory";
DROP TABLE "SyncHistory";
ALTER TABLE "new_SyncHistory" RENAME TO "SyncHistory";
CREATE TABLE "new_Keys" (
    "npub" TEXT NOT NULL PRIMARY KEY,
    "jsonData" TEXT NOT NULL
);
INSERT INTO "new_Keys" ("jsonData", "npub") SELECT "jsonData", "npub" FROM "Keys";
DROP TABLE "Keys";
ALTER TABLE "new_Keys" RENAME TO "Keys";
CREATE TABLE "new_History" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npub" TEXT NOT NULL,
    "appNpub" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
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
    "timestamp" BIGINT NOT NULL,
    "jsonData" TEXT NOT NULL
);
INSERT INTO "new_Perms" ("appNpub", "id", "jsonData", "npub", "perm", "timestamp", "value") SELECT "appNpub", "id", "jsonData", "npub", "perm", "timestamp", "value" FROM "Perms";
DROP TABLE "Perms";
ALTER TABLE "new_Perms" RENAME TO "Perms";
PRAGMA foreign_key_check("Apps");
PRAGMA foreign_key_check("Pending");
PRAGMA foreign_key_check("ConnectTokens");
PRAGMA foreign_key_check("SyncHistory");
PRAGMA foreign_key_check("Keys");
PRAGMA foreign_key_check("History");
PRAGMA foreign_key_check("Perms");
PRAGMA foreign_keys=ON;
