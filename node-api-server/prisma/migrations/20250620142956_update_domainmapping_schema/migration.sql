/*
  Warnings:

  - You are about to drop the column `created_at` on the `DomainMapping` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `DomainMapping` table. All the data in the column will be lost.
  - You are about to drop the column `project_id` on the `DomainMapping` table. All the data in the column will be lost.
  - You are about to drop the column `target_url` on the `DomainMapping` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `DomainMapping` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[domain]` on the table `DomainMapping` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `DomainMapping` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DomainMapping` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DomainMapping" DROP CONSTRAINT "DomainMapping_project_id_fkey";

-- AlterTable
ALTER TABLE "DomainMapping" DROP COLUMN "created_at",
DROP COLUMN "is_active",
DROP COLUMN "project_id",
DROP COLUMN "target_url",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DomainMapping_domain_key" ON "DomainMapping"("domain");

-- AddForeignKey
ALTER TABLE "DomainMapping" ADD CONSTRAINT "DomainMapping_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
