-- CreateTable
CREATE TABLE `MenuSetting` (
    `id` VARCHAR(12) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `path` VARCHAR(200) NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 0,
    `index` INTEGER NOT NULL DEFAULT 0,
    `icon` VARCHAR(100) NULL,
    `parentId` VARCHAR(12) NULL,
    `roleIds` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MenuSetting` ADD CONSTRAINT `MenuSetting_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `MenuSetting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
