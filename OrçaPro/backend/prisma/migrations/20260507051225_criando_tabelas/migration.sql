-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT NOT NULL,
    "cidade" TEXT,
    "bairro" TEXT,
    "numero" TEXT,
    "cep" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "unidade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orcamento" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tipoMaoDeObra" TEXT NOT NULL,
    "maoDeObraValor" DOUBLE PRECISION NOT NULL,
    "tipoLucro" TEXT NOT NULL,
    "lucroValor" DOUBLE PRECISION NOT NULL,
    "totalFinal" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'analise',
    "tipoMovel" TEXT,
    "ambiente" TEXT,
    "medidas" TEXT,
    "prazo" TEXT,
    "pagamento" TEXT,
    "validade" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrcamentoMaterial" (
    "id" SERIAL NOT NULL,
    "orcamentoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrcamentoMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrcamentoMaterial" ADD CONSTRAINT "OrcamentoMaterial_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
