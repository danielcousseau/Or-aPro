-- CreateTable
CREATE TABLE "OpcaoCustomizada" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpcaoCustomizada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpcaoCustomizada_tipo_nome_userId_key" ON "OpcaoCustomizada"("tipo", "nome", "userId");

-- CreateIndex
CREATE INDEX "OpcaoCustomizada_userId_idx" ON "OpcaoCustomizada"("userId");

-- AddForeignKey
ALTER TABLE "OpcaoCustomizada" ADD CONSTRAINT "OpcaoCustomizada_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
