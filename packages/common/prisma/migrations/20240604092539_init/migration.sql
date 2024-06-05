-- CreateTable
CREATE TABLE "Keys" (
    "npub" TEXT NOT NULL PRIMARY KEY,
    "jsonData" TEXT
);

-- CreateTable
CREATE TABLE "Apps" (
    "appNpub" TEXT NOT NULL PRIMARY KEY,
    "npub" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "url" TEXT,
    "updateTimestamp" BIGINT NOT NULL,
    "subNpub" TEXT,
    "permUpdateTimestamp" BIGINT,
    "jsonData" TEXT
);

-- CreateTable
CREATE TABLE "Perms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npub" TEXT NOT NULL,
    "appNpub" TEXT NOT NULL,
    "perm" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "jsonData" TEXT
);

-- CreateTable
CREATE TABLE "Pending" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npub" TEXT NOT NULL,
    "appNpub" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "method" TEXT NOT NULL,
    "jsonData" TEXT
);

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npub" TEXT NOT NULL,
    "appNpub" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "method" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "jsonData" TEXT
);

-- CreateTable
CREATE TABLE "SyncHistory" (
    "npub" TEXT NOT NULL PRIMARY KEY,
    "jsonData" TEXT
);

-- CreateTable
CREATE TABLE "ConnectTokens" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "npub" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "expiry" BIGINT NOT NULL,
    "subNpub" TEXT,
    "jsonData" TEXT
);
