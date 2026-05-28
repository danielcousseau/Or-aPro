"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error(
      "FATAL: JWT_SECRET não está definido nas variáveis de ambiente.",
    );
    res
      .status(500)
      .json({ error: "Erro interno de configuração do servidor." });
    return;
  }
  // Aceita Authorization: Bearer <token> (cross-origin, funciona no Safari/iOS)
  // ou cookie httpOnly como fallback (browsers que aceitam cookies cross-site)
  const authHeader = req.headers.authorization;
  const token =
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null) ??
    req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }
  jsonwebtoken_1.default.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      res.status(401).json({ error: "Token inválido ou expirado." });
      return;
    }
    req.userId = decoded.id;
    next();
  });
}
