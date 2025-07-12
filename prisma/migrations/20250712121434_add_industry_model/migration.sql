-- CreateTable
CREATE TABLE `Book` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `accessLevel` INTEGER NOT NULL DEFAULT 0,
    `coverPath` VARCHAR(191) NOT NULL,
    `pdfPath` VARCHAR(191) NOT NULL,
    `coverFileId` VARCHAR(191) NOT NULL,
    `pdfFileId` VARCHAR(191) NOT NULL,
    `unlist` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `year` INTEGER NULL,
    `issue` INTEGER NULL,
    `time` INTEGER NULL,
    `description` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nickName` VARCHAR(191) NOT NULL,
    `accessLevel` INTEGER NOT NULL DEFAULT 0,
    `name` VARCHAR(20) NULL,
    `title` VARCHAR(20) NULL,
    `organization` VARCHAR(40) NULL,
    `lastVisit` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_nickName_key`(`nickName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccessLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nickName` VARCHAR(191) NOT NULL,
    `firstVisit` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastVisit` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `visitCount` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `AccessLog_nickName_key`(`nickName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Industry` (
    `id` VARCHAR(12) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `level` INTEGER NOT NULL DEFAULT 0,
    `parentId` VARCHAR(12) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Industry` ADD CONSTRAINT `Industry_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Industry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
