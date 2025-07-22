/*
  Warnings:

  - You are about to drop the column `isPaid` on the `Activity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Activity` DROP COLUMN `isPaid`,
    ADD COLUMN `benefitTypeId` VARCHAR(6) NULL;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_benefitTypeId_fkey` FOREIGN KEY (`benefitTypeId`) REFERENCES `BenefitType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
