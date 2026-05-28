"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = validate;
const zod_1 = require("zod");
function validate(schema) {
  return async (req, res, next) => {
    if (!schema) {
      res.status(500).json({
        error:
          "Erro interno: Schema de validação não definido ou importado incorretamente nas rotas.",
      });
      return;
    }
    try {
      // [SecOps] Usa parseAsync para não bloquear a thread principal (previne DoS).
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof zod_1.ZodError) {
        res.status(400).json({
          error: "Dados inválidos enviados no formulário",
          details: error.issues.map((issue) => ({
            campo: issue.path.join("."),
            mensagem: issue.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
