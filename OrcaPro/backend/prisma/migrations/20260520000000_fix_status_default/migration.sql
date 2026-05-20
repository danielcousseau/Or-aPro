-- AlterTable: troca o default de 'analise' para 'Aguardando'
ALTER TABLE "Orcamento" ALTER COLUMN "status" SET DEFAULT 'Aguardando';

-- UpdateData: normaliza registros antigos criados com o default 'analise'
UPDATE "Orcamento" SET "status" = 'Aguardando' WHERE "status" = 'analise';
