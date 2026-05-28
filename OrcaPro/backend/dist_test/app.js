"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const clienteRoutes_1 = __importDefault(require("./routes/clienteRoutes"));
const materialRoutes_1 = __importDefault(require("./routes/materialRoutes"));
const orcamentoRoutes_1 = __importDefault(require("./routes/orcamentoRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const opcaoCustomizadaRoutes_1 = __importDefault(
  require("./routes/opcaoCustomizadaRoutes"),
);
const AuthController_1 = __importDefault(
  require("./controllers/AuthController"),
);
const auth_1 = __importDefault(require("./middlewares/auth"));
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const telegram_1 = require("./services/telegram");
const app = (0, express_1.default)();
app.set("trust proxy", 1);
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  (0, cors_1.default)({
    origin: allowedOrigin,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);
app.use((0, helmet_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
const isTest = process.env.NODE_ENV === "test";
if (!isTest) {
  const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: {
      error:
        "Atividade suspeita detectada. Muitas requisições feitas por este IP. Tente novamente mais tarde.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", limiter);
}
const authLimiter = isTest
  ? (_req, _res, next) => next()
  : (0, express_rate_limit_1.default)({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: { error: "Muitas tentativas. Tente novamente em 15 minutos." },
      standardHeaders: true,
      legacyHeaders: false,
    });
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "API do OrcaPro rodando!" });
});
app.post("/api/login", authLimiter, AuthController_1.default.login);
app.post("/api/registrar", authLimiter, AuthController_1.default.register);
app.post("/api/refresh", AuthController_1.default.refresh);
app.post(
  "/api/forgot-password",
  authLimiter,
  AuthController_1.default.forgotPassword,
);
app.post("/api/reset-password", AuthController_1.default.resetPassword);
app.get("/api/me", auth_1.default, AuthController_1.default.me);
app.post("/api/logout", auth_1.default, AuthController_1.default.logout);
app.put(
  "/api/usuarios/perfil",
  auth_1.default,
  AuthController_1.default.atualizarPerfil,
);
app.put(
  "/api/usuarios/senha",
  auth_1.default,
  AuthController_1.default.alterarSenha,
);
app.use("/api/clientes", clienteRoutes_1.default);
app.use("/api/materiais", materialRoutes_1.default);
app.use("/api/orcamentos", orcamentoRoutes_1.default);
app.use("/api/audit-log", auditRoutes_1.default);
app.use("/api/opcoes-customizadas", opcaoCustomizadaRoutes_1.default);
app.get("/api/telegram/pendentes", auth_1.default, async (_req, res) => {
  const mensagens = await (0, telegram_1.buscarPendentes)();
  res.json(mensagens);
});
app.use(errorHandler_1.default);
module.exports = app;
