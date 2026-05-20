async function enviarEmailResetSenha(destinatario, nomeUsuario, linkReset) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: {
                name: 'OrcaPro',
                email: process.env.EMAIL_FROM || 'noreply@orcapro.com',
            },
            to: [{ email: destinatario, name: nomeUsuario }],
            subject: 'Redefinição de Senha — OrcaPro',
            htmlContent: `
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
        }),
    });

    if (!response.ok) {
        const erro = await response.text();
        throw new Error(`Brevo API error ${response.status}: ${erro}`);
    }
}

module.exports = { enviarEmailResetSenha };
