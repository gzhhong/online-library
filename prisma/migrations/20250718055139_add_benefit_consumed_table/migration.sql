-- AlterTable
ALTER TABLE `Member` MODIFY `openId` VARCHAR(100) NULL;

-- CreateTable
CREATE TABLE `BenefitConsumed` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` INTEGER NOT NULL,
    `memberName` VARCHAR(100) NOT NULL,
    `memberType` VARCHAR(20) NOT NULL,
    `benefitType` VARCHAR(20) NOT NULL,
    `benefitTypeId` VARCHAR(6) NOT NULL,
    `benefitTitle` VARCHAR(100) NOT NULL,
    `benefitIsPaid` BOOLEAN NOT NULL DEFAULT false,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BenefitConsumed_memberId_benefitTypeId_key`(`memberId`, `benefitTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BenefitConsumed` ADD CONSTRAINT `BenefitConsumed_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BenefitConsumed` ADD CONSTRAINT `BenefitConsumed_benefitTypeId_fkey` FOREIGN KEY (`benefitTypeId`) REFERENCES `BenefitType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
