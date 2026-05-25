"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificarMudancaStatus = notificarMudancaStatus;
exports.buscarPendentes = buscarPendentes;
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const MENSAGENS_STATUS = {
    'Aprovado': (titulo) => `✅ *Ótima notícia!* Seu projeto *${titulo}* foi aprovado. Em breve entraremos em contato com os próximos passos!`,
    'Produção': (titulo) => `🔨 Seu projeto *${titulo}* entrou em produção! Nossa equipe já está trabalhando nele.`,
    'Instalação': (titulo) => `🚚 Seu projeto *${titulo}* está pronto! Em breve entraremos em contato para agendar a instalação.`,
    'Entregue': (titulo) => `🎉 Seu projeto *${titulo}* foi entregue com sucesso! Obrigado pela confiança.`,
};
async function enviarMensagem(chatId, texto) {
    if (!process.env.TELEGRAM_BOT_TOKEN)
        return;
    await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'Markdown' }),
    });
}
async function notificarMudancaStatus(cliente, tituloOrcamento, novoStatus) {
    if (!cliente?.telegramChatId)
        return;
    const mensagem = MENSAGENS_STATUS[novoStatus];
    if (!mensagem)
        return;
    await enviarMensagem(cliente.telegramChatId, mensagem(tituloOrcamento));
}
async function buscarPendentes() {
    if (!process.env.TELEGRAM_BOT_TOKEN)
        return [];
    const res = await fetch(`${TELEGRAM_API}/getUpdates`);
    const data = await res.json();
    return (data.result || []).map((u) => ({
        nome: u.message?.from?.first_name || 'Desconhecido',
        username: u.message?.from?.username || '-',
        chatId: u.message?.chat?.id,
        mensagem: u.message?.text || '',
    }));
}
