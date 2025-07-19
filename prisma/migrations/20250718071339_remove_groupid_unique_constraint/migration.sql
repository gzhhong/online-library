/*
  Warnings:

  - You are about to drop the column `benefitType` on the `BenefitConsumed` table. All the data in the column will be lost.
  - You are about to drop the column `benefitType` on the `Member` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[benefitGroupId]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `benefitGroupId` to the `BenefitConsumed` table without a default value. This is not possible if the table is not empty.
  - Added the required column `benefitGroupId` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `BenefitConsumed` DROP COLUMN `benefitType`,
    ADD COLUMN `benefitGroupId` VARCHAR(6) NOT NULL;

-- AlterTable
ALTER TABLE `Member` DROP COLUMN `benefitType`,
    ADD COLUMN `benefitGroupId` VARCHAR(6) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Member_benefitGroupId_key` ON `Member`(`benefitGroupId`);
