const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");
const {
  criarUsuarioTeste,
  limparUsuarioTeste,
  parseCookies,
} = require("./helpers");

let userA, userB, cookiesA, cookiesB;
let orcamentoIdA;

const PDF_FALSO = Buffer.from("%PDF-1.4 conteudo de teste");

async function login(usuario) {
  const res = await request(app)
    .post("/api/login")
    .send({ usuario, senha: "senha123" });
  return parseCookies(res);
}

beforeAll(async () => {
  [userA, userB] = await Promise.all([
    criarUsuarioTeste("tg_a"),
    criarUsuarioTeste("tg_b"),
  ]);
  [cookiesA, cookiesB] = await Promise.all([
    login(userA.usuario),
    login(userB.usuario),
  ]);

  // Cliente de A sem telegramChatId (nunca conectou o bot)
  const resCliente = await request(app)
    .post("/api/clientes")
    .set("Cookie", cookiesA)
    .send({ nome: "Cliente Sem Telegram", telefone: "11999999999" });

  const resOrcamento = await request(app)
    .post("/api/orcamentos")
    .set("Cookie", cookiesA)
    .send({
      titulo: "Armário de teste Telegram",
      clienteId: resCliente.body.id,
      tipoMaoDeObra: "Fixo",
      maoDeObraValor: 100,
      tipoLucro: "Fixo",
      lucroValor: 50,
      totalFinal: 150,
    });
  orcamentoIdA = resOrcamento.body.id;
});

afterAll(async () => {
  await Promise.all([
    limparUsuarioTeste(userA.id),
    limparUsuarioTeste(userB.id),
  ]);
  await prisma.$disconnect();
});

describe("POST /api/orcamentos/:id/enviar-telegram", () => {
  it("exige login (401 sem cookie)", async () => {
    const res = await request(app)
      .post(`/api/orcamentos/${orcamentoIdA}/enviar-telegram`)
      .set("Content-Type", "application/pdf")
      .send(PDF_FALSO);
    expect(res.status).toBe(401);
  });

  it("cross-tenant: usuário B não envia o orçamento de A (404)", async () => {
    const res = await request(app)
      .post(`/api/orcamentos/${orcamentoIdA}/enviar-telegram`)
      .set("Cookie", cookiesB)
      .set("Content-Type", "application/pdf")
      .send(PDF_FALSO);
    expect(res.status).toBe(404);
  });

  it("retorna 400 quando o PDF não é enviado no body", async () => {
    const res = await request(app)
      .post(`/api/orcamentos/${orcamentoIdA}/enviar-telegram`)
      .set("Cookie", cookiesA);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/PDF/);
  });

  it("retorna 400 quando o cliente não conectou o Telegram", async () => {
    const res = await request(app)
      .post(`/api/orcamentos/${orcamentoIdA}/enviar-telegram`)
      .set("Cookie", cookiesA)
      .set("Content-Type", "application/pdf")
      .send(PDF_FALSO);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Telegram/);
  });

  it("orçamento inexistente retorna 404", async () => {
    const res = await request(app)
      .post("/api/orcamentos/999999999/enviar-telegram")
      .set("Cookie", cookiesA)
      .set("Content-Type", "application/pdf")
      .send(PDF_FALSO);
    expect(res.status).toBe(404);
  });
});
