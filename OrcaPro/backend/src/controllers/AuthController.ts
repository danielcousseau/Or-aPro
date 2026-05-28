import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma = require("../lib/prisma");
import { enviarEmailResetSenha } from "../services/emailService";
import MATERIAIS_PADRAO from "../constants/materiaisPadrao";
import { registrar } from "../services/audit";

const isProduction = process.env.NODE_ENV === "production";

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    maxAge,
    path: "/",
  };
}

export default {
  async login(req: Request, res: Response): Promise<void> {
    const { usuario, senha } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { usuario } });

      if (!user) {
        res.status(401).json({ error: "Usuário ou senha inválidos" });
        return;
      }

      const senhaValida = await bcrypt.compare(senha, user.password);
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

      const accessToken = jwt.sign({ id: user.id }, jwtSecret, {
        expiresIn: "15m",
      });
      const refreshToken = jwt.sign(
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

      await registrar(user.id, "login", "Sessão", null, null);

      res.json({
        user: {
          id: user.id,
          usuario: user.usuario,
          nome: user.name,
          email: user.email,
          avatar: user.avatar || null,
          nomeMarcenaria: user.nomeMarcenaria || null,
          logoMarcenaria: user.logoMarcenaria || null,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
      return;
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as {
        id: number;
        type: string;
      };
      if (decoded.type !== "refresh") throw new Error("Token inválido");

      const newAccessToken = jwt.sign(
        { id: decoded.id },
        process.env.JWT_SECRET!,
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

  async me(req: Request, res: Response): Promise<void> {
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
          logoMarcenaria: true,
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
        logoMarcenaria: user.logoMarcenaria || null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie("token", cookieOpts(0));
    res.clearCookie("refreshToken", cookieOpts(0));
    res.json({ ok: true });
  },

  async register(req: Request, res: Response): Promise<void> {
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
        const verifyData = (await verifyRes.json()) as { success: boolean };
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

      const hashPassword = await bcrypt.hash(senha, 10);
      const novoUsuario = await prisma.user.create({
        data: {
          name: nome,
          usuario,
          password: hashPassword,
          email: email || null,
        },
      });

      await prisma.material.createMany({
        data: MATERIAIS_PADRAO.map((m) => ({ ...m, userId: novoUsuario.id })),
      });

      res.status(201).json({ message: "Conta criada com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao criar conta." });
    }
  },

  async atualizarPerfil(req: Request, res: Response): Promise<void> {
    try {
      const { nome, email, avatar, nomeMarcenaria, logoMarcenaria } = req.body;
      const data: Record<string, unknown> = {
        name: nome,
        email: email || null,
      };
      if (avatar !== undefined) data.avatar = avatar;
      if (nomeMarcenaria !== undefined)
        data.nomeMarcenaria = nomeMarcenaria || null;
      if (logoMarcenaria !== undefined)
        data.logoMarcenaria = logoMarcenaria || null;
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
          logoMarcenaria: true,
        },
      });
      res.json({
        id: user.id,
        usuario: user.usuario,
        nome: user.name,
        email: user.email,
        avatar: user.avatar || null,
        nomeMarcenaria: user.nomeMarcenaria || null,
        logoMarcenaria: user.logoMarcenaria || null,
      });
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
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

  async alterarSenha(req: Request, res: Response): Promise<void> {
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
      const senhaValida = await bcrypt.compare(senhaAtual, user.password);
      if (!senhaValida) {
        res.status(400).json({ error: "Senha atual incorreta." });
        return;
      }

      const hashNovaSenha = await bcrypt.hash(novaSenha, 10);
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

  async forgotPassword(req: Request, res: Response): Promise<void> {
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
      const resetToken = jwt.sign({ userId: user.id }, resetSecret, {
        expiresIn: "1h",
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const linkReset = `${frontendUrl}/redefinir-senha?token=${resetToken}&id=${user.id}`;

      await enviarEmailResetSenha(user.email, user.name, linkReset);

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

  async resetPassword(req: Request, res: Response): Promise<void> {
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
        jwt.verify(token, resetSecret);
      } catch {
        res.status(400).json({ error: "Link inválido ou expirado." });
        return;
      }

      const hashNovaSenha = await bcrypt.hash(novaSenha, 10);
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
