const nodemailer = require('nodemailer');

function criarTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
}

async function enviarEmailResetSenha(destinatario, nomeUsuario, linkReset) {
    const transporter = criarTransporter();

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"OrcaPro" <noreply@orcapro.com>',
        to: destinatario,
        subject: 'Redefinição de Senha — OrcaPro',
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 8px;">
                <h2 style="color: #0056A3; margin-top: 0;">Redefinição de Senha</h2>
                <p>Olá, <strong>${nomeUsuario}</strong>.</p>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta no OrcaPro.</p>
                <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
                <a href="${linkReset}" style="
                    display: inline-block; margin: 24px 0;
                    background: #0056A3; color: #fff;
                    padding: 12px 28px; border-radius: 6px;
                    text-decoration: none; font-weight: bold;
                ">Redefinir Senha</a>
                <p style="color: #888; font-size: 0.85rem;">
                    Se você não solicitou isso, ignore este e-mail. Sua senha permanece a mesma.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #aaa; font-size: 0.78rem; margin: 0;">OrcaPro — Gestão de Orçamentos para Marcenarias</p>
            </div>
        `,
    });
}

module.exports = { enviarEmailResetSenha };
