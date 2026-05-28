import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  code?: string;
  status?: number;
  errors?: unknown[];
}

export default function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(`[ERROR] ${req.method} ${req.path}`, err);

  if (err.code === "P2002") {
    res.status(409).json({ error: "Este registro já existe." });
    return;
  }
  if (err.code === "P2025") {
    res.status(404).json({ error: "Registro não encontrado." });
    return;
  }
  if (err.code === "P2003") {
    res.status(400).json({
      error: "Referência inválida: o recurso relacionado não existe.",
    });
    return;
  }

  if (err.name === "ZodError") {
    res.status(400).json({ error: "Dados inválidos.", details: err.errors });
    return;
  }

  const status = err.status ?? 500;
  const message = status < 500 ? err.message : "Erro interno do servidor.";
  res.status(status).json({ error: message });
}
