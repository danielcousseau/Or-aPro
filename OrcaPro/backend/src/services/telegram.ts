const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const MENSAGENS_STATUS: Record<string, (titulo: string) => string> = {
  Aprovado: (titulo) =>
    `✅ *Ótima notícia!* Seu projeto *${titulo}* foi aprovado. Em breve entraremos em contato com os próximos passos!`,
  Produção: (titulo) =>
    `🔨 Seu projeto *${titulo}* entrou em produção! Nossa equipe já está trabalhando nele.`,
  Instalação: (titulo) =>
    `🚚 Seu projeto *${titulo}* está pronto! Em breve entraremos em contato para agendar a instalação.`,
  Entregue: (titulo) =>
    `🎉 Seu projeto *${titulo}* foi entregue com sucesso! Obrigado pela confiança.`,
};

interface ClienteComTelegram {
  telegramChatId?: string | null;
}

interface TelegramUpdate {
  nome: string;
  username: string;
  chatId: number | undefined;
  mensagem: string;
}

async function enviarMensagem(chatId: string, texto: string): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
      parse_mode: "Markdown",
    }),
  });
}

export async function notificarMudancaStatus(
  cliente: ClienteComTelegram,
  tituloOrcamento: string,
  novoStatus: string,
): Promise<void> {
  if (!cliente?.telegramChatId) return;
  const mensagem = MENSAGENS_STATUS[novoStatus];
  if (!mensagem) return;
  await enviarMensagem(cliente.telegramChatId, mensagem(tituloOrcamento));
}

export async function buscarPendentes(): Promise<TelegramUpdate[]> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return [];
  const res = await fetch(`${TELEGRAM_API}/getUpdates`);
  const data = (await res.json()) as { result?: any[] };
  return (data.result || []).map((u: any) => ({
    nome: u.message?.from?.first_name || "Desconhecido",
    username: u.message?.from?.username || "-",
    chatId: u.message?.chat?.id,
    mensagem: u.message?.text || "",
  }));
}
