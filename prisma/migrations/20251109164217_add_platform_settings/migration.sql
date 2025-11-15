/*
  Warnings:

  - You are about to drop the column `rejectionReason` on the `IdDocument` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `IdDocument` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedBy` on the `IdDocument` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "TermsPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departureCountry" TEXT,
    "departureCity" TEXT,
    "destinationCountry" TEXT,
    "destinationCity" TEXT,
    "alertType" TEXT NOT NULL DEFAULT 'all',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IdDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "frontImagePath" TEXT,
    "backImagePath" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IdDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_IdDocument" ("backImagePath", "documentType", "frontImagePath", "id", "updatedAt", "uploadedAt", "userId", "verificationStatus") SELECT "backImagePath", "documentType", "frontImagePath", "id", "updatedAt", "uploadedAt", "userId", "verificationStatus" FROM "IdDocument";
DROP TABLE "IdDocument";
ALTER TABLE "new_IdDocument" RENAME TO "IdDocument";
CREATE INDEX "IdDocument_userId_idx" ON "IdDocument"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");

-- CreateIndex
CREATE INDEX "Alert_isActive_idx" ON "Alert"("isActive");

-- CreateIndex
CREATE INDEX "Alert_alertType_idx" ON "Alert"("alertType");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSettings_key_key" ON "PlatformSettings"("key");
