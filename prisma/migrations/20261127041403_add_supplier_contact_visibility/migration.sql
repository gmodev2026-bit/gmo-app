-- AlterTable
ALTER TABLE "supplier" ADD COLUMN     "isContactNamePublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEmailPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhonePublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWebsitePublic" BOOLEAN NOT NULL DEFAULT false;
