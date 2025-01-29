-- CreateEnum
CREATE TYPE "BackupEnvironment" AS ENUM ('PRODUCTION', 'DEVELOPMENT');

-- CreateEnum
CREATE TYPE "TriggerMethod" AS ENUM ('CRON', 'MANUAL');

-- CreateEnum
CREATE TYPE "RestoreStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Backup" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dbName" TEXT NOT NULL,
    "environment" "BackupEnvironment" NOT NULL,
    "triggeredBy" "TriggerMethod" NOT NULL,
    "driveFolderId" TEXT,
    "driveFileId" TEXT,
    "localPath" TEXT,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restore" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RestoreStatus" NOT NULL DEFAULT 'PENDING',
    "backupId" TEXT NOT NULL,

    CONSTRAINT "Restore_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Restore" ADD CONSTRAINT "Restore_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "Backup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
