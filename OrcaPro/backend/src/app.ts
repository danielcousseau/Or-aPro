import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import clienteRoutes from "./routes/clienteRoutes";
import materialRoutes from "./routes/materialRoutes";
import orcamentoRoutes from "./routes/orcamentoRoutes";
import auditRoutes from "./routes/auditRoutes";
import opcaoCustomizadaRoutes from "./routes/opcaoCustomizadaRoutes";
import pagamentoRoutes from "./routes/pagamentoRoutes";
import marcenariaRoutes from "./routes/marcenariaRoutes";
import AuthController from "./controllers/AuthController";
import authMiddleware from "./middlewares/auth";
import errorHandler from "./middlewares/errorHandler";
import { buscarPendentes } from "./services/telegram";

const app = express();
app.set("trust proxy", 1);

const frontendUrls = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const allowedOrigins = [
  ...frontendUrls,
  "https://or-a-pro-daniel.vercel.app",
  "https://orca-pro-seven.vercel.app",
  "https://localhost", // app nativo Android (Capacitor)
  "capacitor://localhost", // app nativo iOS (Capacitor)
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "600kb" }));

const isTest = process.env.NODE_ENV === "test";

if (!isTest) {
  const limiter = rateLimit({
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
  ? (_req: Request, _res: Response, next: NextFunction) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: { error: "Muitas tentativas. Tente novamente em 15 minutos." },
      standardHeaders: true,
      legacyHeaders: false,
    });

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "API do OrcaPro rodando!" });
});

app.post("/api/login", authLimiter, AuthController.login);
app.post("/api/registrar", authLimiter, AuthController.register);
app.post("/api/refresh", AuthController.refresh);
app.post("/api/forgot-password", authLimiter, AuthController.forgotPassword);
app.post("/api/reset-password", AuthController.resetPassword);

app.get("/api/me", authMiddleware, AuthController.me);
app.post("/api/logout", authMiddleware, AuthController.logout);
app.put("/api/usuarios/perfil", authMiddleware, AuthController.atualizarPerfil);
app.put("/api/usuarios/senha", authMiddleware, AuthController.alterarSenha);

app.use("/api/clientes", clienteRoutes);
app.use("/api/materiais", materialRoutes);
app.use("/api/orcamentos", orcamentoRoutes);
app.use("/api/audit-log", auditRoutes);
app.use("/api/opcoes-customizadas", opcaoCustomizadaRoutes);
app.use("/api/pagamentos", pagamentoRoutes);
app.use("/api/marcenaria", marcenariaRoutes);

app.get(
  "/api/telegram/pendentes",
  authMiddleware,
  async (_req: Request, res: Response) => {
    const mensagens = await buscarPendentes();
    res.json(mensagens);
  },
);

app.use(errorHandler);

export = app;
