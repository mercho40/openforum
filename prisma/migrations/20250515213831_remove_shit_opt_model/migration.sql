/*
  Warnings:

  - You are about to drop the column `otpExpiry` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `otpSecret` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `otp_verification` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "otpExpiry",
DROP COLUMN "otpSecret";

-- DropTable
DROP TABLE "otp_verification";
