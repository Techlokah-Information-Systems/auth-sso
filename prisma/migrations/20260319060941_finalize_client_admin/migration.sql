/*
  Warnings:

  - You are about to drop the column `clerk_client_id` on the `Client` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[client_id]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_user_id_fkey";

-- DropIndex
DROP INDEX "Client_clerk_client_id_idx";

-- DropIndex
DROP INDEX "Client_clerk_client_id_key";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "clerk_client_id",
ADD COLUMN     "client_id" TEXT,
ADD COLUMN     "redirect_uri" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Client_client_id_key" ON "Client"("client_id");

-- CreateIndex
CREATE INDEX "Client_client_id_idx" ON "Client"("client_id");

-- CreateIndex
CREATE INDEX "Client_redirect_uri_idx" ON "Client"("redirect_uri");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
