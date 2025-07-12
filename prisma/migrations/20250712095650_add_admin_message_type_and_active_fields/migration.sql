/*
  Warnings:

  - Added the required column `updatedAt` to the `admin_messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR');

-- AlterTable
ALTER TABLE "admin_messages" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'INFO',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
