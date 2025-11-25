/*
  Warnings:

  - You are about to drop the column `latitude` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `listings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `listings` DROP COLUMN `latitude`,
    DROP COLUMN `longitude`,
    ADD COLUMN `address` VARCHAR(191) NULL;
