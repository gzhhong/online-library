/*
  Warnings:

  - Added the required column `openId` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Member` ADD COLUMN `openId` VARCHAR(100) NOT NULL,
    MODIFY `isStopped` BOOLEAN NULL DEFAULT false;
