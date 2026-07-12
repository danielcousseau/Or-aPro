// Cadastro passa pelo backend do Daniel (aceita chave de teste do Turnstile).
// Demais rotas /api/* continuam no proxy do vercel.json → orcapro-api.
const BACKEND_URL =
  process.env.BACKEND_REGISTRAR_URL ||
  "https://or-a-pro-daniel.onrender.com/api/registrar";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  try {
    const upstream = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const text = await upstream.text();
    res.status(upstream.status).setHeader("Content-Type", "application/json");
    res.send(text);
  } catch {
    res.status(503).json({
      error:
        "Servidor de cadastro indisponível. Tente de novo em alguns minutos ou faça login se já tiver conta.",
    });
  }
}
