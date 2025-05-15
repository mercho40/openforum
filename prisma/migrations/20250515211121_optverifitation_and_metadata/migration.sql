-- AlterTable
ALTER TABLE "user" ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "otpExpiry" TIMESTAMP(3),
ADD COLUMN     "otpSecret" TEXT,
ADD COLUMN     "profileUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "profileViewed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "otp_verification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "otp_verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_verification_token_idx" ON "otp_verification"("token");

-- CreateIndex
CREATE UNIQUE INDEX "otp_verification_email_type_key" ON "otp_verification"("email", "type");
