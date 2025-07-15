-- CreateTable
CREATE TABLE `BenefitType` (
    `id` VARCHAR(6) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `isPaid` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BenefitGroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupId` VARCHAR(6) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `benefitTypeId` VARCHAR(6) NOT NULL,
    `times` INTEGER NOT NULL DEFAULT 1,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `notShow` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BenefitGroup` ADD CONSTRAINT `BenefitGroup_benefitTypeId_fkey` FOREIGN KEY (`benefitTypeId`) REFERENCES `BenefitType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
