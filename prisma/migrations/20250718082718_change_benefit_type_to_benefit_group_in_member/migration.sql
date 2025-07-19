/*
  Warnings:

  - You are about to drop the column `benefitGroupId` on the `BenefitConsumed` table. All the data in the column will be lost.
  - You are about to drop the column `benefitGroupId` on the `Member` table. All the data in the column will be lost.
  - Added the required column `benefitGroup` to the `BenefitConsumed` table without a default value. This is not possible if the table is not empty.
  - Added the required column `benefitGroup` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Member_benefitGroupId_key` ON `Member`;

-- AlterTable
ALTER TABLE `BenefitConsumed` DROP COLUMN `benefitGroupId`,
    ADD COLUMN `benefitGroup` VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE `Member` DROP COLUMN `benefitGroupId`,
    ADD COLUMN `benefitGroup` VARCHAR(100) NOT NULL;
