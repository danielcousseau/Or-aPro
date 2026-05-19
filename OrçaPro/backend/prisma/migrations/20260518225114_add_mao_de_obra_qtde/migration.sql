/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[usuario]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usuario` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "rua" TEXT;

-- AlterTable
ALTER TABLE "Orcamento" ADD COLUMN     "maoDeObraQtde" DOUBLE PRECISION DEFAULT 1;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
ADD COLUMN     "usuario" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_usuario_key" ON "User"("usuario");
