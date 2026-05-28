"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = require("../lib/prisma");
const emailService_1 = require("../services/emailService");
const materiaisPadrao_1 = __importDefault(
  require("../constants/materiaisPadrao"),
);
const audit_1 = require("../services/audit");
const isProduction = process.env.NODE_ENV === "production";
function cookieOpts(maxAge) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge,
    path: "/",
  };
}
exports.default = {
  async login(req, res) {
    const { usuario, senha } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { usuario } });
      if (!user) {
        res.status(401).json({ error: "Usuário ou senha inválidos" });
        return;
      }
      const senhaValida = await bcryptjs_1.default.compare(
        senha,
        user.password,
      );
      if (!senhaValida) {
        res.status(401).json({ error: "Usuário ou senha inválidos" });
        return;
      }
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error("CRÍTICO: JWT_SECRET não configurado.");
        res
          .status(500)
          .json({ error: "Erro interno de configuração do servidor" });
        return;
      }
      const accessToken = jsonwebtoken_1.default.sign(
        { id: user.id },
        jwtSecret,
        { expiresIn: "15m" },
      );
      const refreshToken = jsonwebtoken_1.default.sign(
        { id: user.id, type: "refresh" },
        jwtSecret,
        { expiresIn: "7d" },
      );
      res.cookie("token", accessToken, cookieOpts(15 * 60 * 1000));
      res.cookie(
        "refreshToken",
        refreshToken,
        cookieOpts(7 * 24 * 60 * 60 * 1000),
      );
      await (0, audit_1.registrar)(user.id, "login", "Sessão", null, null);
      res.json({
        user: {
          id: user.id,
          usuario: user.usuario,
          nome: user.name,
          email: user.email,
          avatar: user.avatar || null,
          nomeMarcenaria: user.nomeMarcenaria || null,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  },
  async refresh(req, res) {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
      return;
    }
    try {
      const decoded = jsonwebtoken_1.default.verify(
        refreshToken,
        process.env.JWT_SECRET,
      );
      if (decoded.type !== "refresh") throw new Error("Token inválido");
      const newAccessToken = jsonwebtoken_1.default.sign(
        { id: decoded.id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
      );
      res.cookie("token", newAccessToken, cookieOpts(15 * 60 * 1000));
      res.json({ ok: true, accessToken: newAccessToken });
    } catch {
      res.clearCookie("token");
      res.clearCookie("refreshToken");
      res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }
  },
  async me(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          usuario: true,
          name: true,
          email: true,
          avatar: true,
          nomeMarcenaria: true,
        },
      });
      if (!user) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }
      res.json({
        id: user.id,
        usuario: user.usuario,
        nome: user.name,
        email: user.email,
        avatar: user.avatar || null,
        nomeMarcenaria: user.nomeMarcenaria || null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  },
  async logout(_req, res) {
    res.clearCookie("token", cookieOpts(0));
    res.clearCookie("refreshToken", cookieOpts(0));
    res.json({ ok: true });
  },
  async register(req, res) {
    try {
      const { nome, usuario, senha, email, turnstileToken } = req.body;
      const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
      if (turnstileSecret) {
        const verifyRes = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              secret: turnstileSecret,
              response: turnstileToken,
            }),
          },
        );
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          res.status(400).json({
            error: "Verificação de segurança falhou. Tente novamente.",
          });
          return;
        }
      }
      const userExists = await prisma.user.findUnique({ where: { usuario } });
      if (userExists) {
        res.status(400).json({ error: "Este nome de usuário já está em uso." });
        return;
      }
      const hashPassword = await bcryptjs_1.default.hash(senha, 10);
      const novoUsuario = await prisma.user.create({
        data: {
          name: nome,
          usuario,
          password: hashPassword,
          email: email || null,
        },
      });
      await prisma.material.createMany({
        data: materiaisPadrao_1.default.map((m) => ({
          ...m,
          userId: novoUsuario.id,
        })),
      });
      res.status(201).json({ message: "Conta criada com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao criar conta." });
    }
  },
  async atualizarPerfil(req, res) {
    try {
      const { nome, email, avatar, nomeMarcenaria } = req.body;
      const data = { name: nome, email: email || null };
      if (avatar !== undefined) data.avatar = avatar;
      if (nomeMarcenaria !== undefined)
        data.nomeMarcenaria = nomeMarcenaria || null;
      const user = await prisma.user.update({
        where: { id: req.userId },
        data,
        select: {
          id: true,
          usuario: true,
          name: true,
          email: true,
          avatar: true,
          nomeMarcenaria: true,
        },
      });
      res.json({
        id: user.id,
        usuario: user.usuario,
        nome: user.name,
        email: user.email,
        avatar: user.avatar || null,
        nomeMarcenaria: user.nomeMarcenaria || null,
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        res
          .status(409)
          .json({ error: "Este e-mail já está em uso por outra conta." });
        return;
      }
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar perfil." });
    }
  },
  async alterarSenha(req, res) {
    try {
      const { senhaAtual, novaSenha } = req.body;
      if (!senhaAtual || !novaSenha || novaSenha.length < 6) {
        res
          .status(400)
          .json({ error: "Dados inválidos para alteração de senha." });
        return;
      }
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }
      const senhaValida = await bcryptjs_1.default.compare(
        senhaAtual,
        user.password,
      );
      if (!senhaValida) {
        res.status(400).json({ error: "Senha atual incorreta." });
        return;
      }
      const hashNovaSenha = await bcryptjs_1.default.hash(novaSenha, 10);
      await prisma.user.update({
        where: { id: req.userId },
        data: { password: hashNovaSenha },
      });
      res.json({ message: "Senha atualizada com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao alterar senha." });
    }
  },
  async forgotPassword(req, res) {
    try {
      const { usuario } = req.body;
      if (!usuario) {
        res.status(400).json({ error: "Informe o nome de usuário." });
        return;
      }
      const user = await prisma.user.findUnique({ where: { usuario } });
      // Sempre retorna sucesso — não expõe se o usuário existe (prevenção de enumeração)
      if (!user || !user.email) {
        res.json({
          message:
            "Se este usuário existir e tiver um e-mail cadastrado, você receberá as instruções em breve.",
        });
        return;
      }
      // O hash da senha atual faz parte do segredo — trocar a senha invalida o token automaticamente
      const resetSecret = process.env.JWT_SECRET + user.password;
      const resetToken = jsonwebtoken_1.default.sign(
        { userId: user.id },
        resetSecret,
        { expiresIn: "1h" },
      );
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const linkReset = `${frontendUrl}/redefinir-senha?token=${resetToken}&id=${user.id}`;
      await (0, emailService_1.enviarEmailResetSenha)(
        user.email,
        user.name,
        linkReset,
      );
      res.json({
        message:
          "Se este usuário existir e tiver um e-mail cadastrado, você receberá as instruções em breve.",
      });
    } catch (error) {
      console.error("Erro ao processar recuperação de senha:", error);
      res.json({
        message:
          "Se este usuário existir e tiver um e-mail cadastrado, você receberá as instruções em breve.",
      });
    }
  },
  async resetPassword(req, res) {
    try {
      const { token, userId, novaSenha } = req.body;
      if (!token || !userId || !novaSenha || novaSenha.length < 6) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
      }
      const user = await prisma.user.findUnique({
        where: { id: Number(userId) },
      });
      if (!user) {
        res.status(400).json({ error: "Link inválido ou expirado." });
        return;
      }
      const resetSecret = process.env.JWT_SECRET + user.password;
      try {
        jsonwebtoken_1.default.verify(token, resetSecret);
      } catch {
        res.status(400).json({ error: "Link inválido ou expirado." });
        return;
      }
      const hashNovaSenha = await bcryptjs_1.default.hash(novaSenha, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashNovaSenha },
      });
      res.json({
        message: "Senha redefinida com sucesso! Faça login com a nova senha.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao redefinir senha." });
    }
  },
};
