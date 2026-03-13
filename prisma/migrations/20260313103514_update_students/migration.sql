/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "students" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "students_phone_key" ON "students"("phone");
