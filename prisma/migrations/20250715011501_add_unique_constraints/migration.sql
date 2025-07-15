/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Member` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Member` ADD COLUMN `isStopped` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `password` VARCHAR(20) NOT NULL DEFAULT 'temp_password';

-- CreateIndex
CREATE UNIQUE INDEX `Member_email_key` ON `Member`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `Member_phone_key` ON `Member`(`phone`);
