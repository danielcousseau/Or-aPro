const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");
const {
  criarUsuarioTeste,
  limparUsuarioTeste,
  parseCookies,
} = require("./helpers");

let userA, userB, cookiesA, cookiesB;

async function login(usuario) {
  const res = await request(app)
    .post("/api/login")
    .send({ usuario, senha: "senha123" });
  return parseCookies(res);
}

beforeAll(async () => {
  [userA, userB] = await Promise.all([
    criarUsuarioTeste("tenant_a"),
    criarUsuarioTeste("tenant_b"),
  ]);
  [cookiesA, cookiesB] = await Promise.all([
    login(userA.usuario),
    login(userB.usuario),
  ]);
});

afterAll(async () => {
  await Promise.all([
    limparUsuarioTeste(userA.id),
    limparUsuarioTeste(userB.id),
  ]);
  await prisma.$disconnect();
});

describe("Isolamento cross-tenant — Clientes", () => {
  let clienteIdA;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/clientes")
      .set("Cookie", cookiesA)
      .send({ nome: "Cliente do Usuário A", telefone: "11999999999" });
    clienteIdA = res.body.id;
  });

  it("usuário B não lê o cliente de A (404)", async () => {
    const res = await request(app)
      .get(`/api/clientes/${clienteIdA}`)
      .set("Cookie", cookiesB);
    expect(res.status).toBe(404);
  });

  it("usuário B não edita o cliente de A (403)", async () => {
    const res = await request(app)
      .put(`/api/clientes/${clienteIdA}`)
      .set("Cookie", cookiesB)
      .send({ nome: "Invasão", telefone: "11000000000" });
    expect(res.status).toBe(403);
  });

  it("usuário B não exclui o cliente de A (403)", async () => {
    const res = await request(app)
      .delete(`/api/clientes/${clienteIdA}`)
      .set("Cookie", cookiesB);
    expect(res.status).toBe(403);
  });

  it("usuário B lista apenas seus próprios clientes (lista vazia)", async () => {
    const res = await request(app).get("/api/clientes").set("Cookie", cookiesB);
    expect(res.status).toBe(200);
    expect(res.body.every((c) => c.userId === userB.id)).toBe(true);
  });
});

describe("Isolamento cross-tenant — Materiais", () => {
  let materialIdA;

  beforeAll(async () => {
    // Garante que usuário A tem ao menos 1 material (lazy init cria os padrões)
    const res = await request(app)
      .get("/api/materiais")
      .set("Cookie", cookiesA);
    materialIdA = res.body[0]?.id;
  });

  it("usuário B não edita material de A (403)", async () => {
    if (!materialIdA) return;
    const res = await request(app)
      .put(`/api/materiais/${materialIdA}`)
      .set("Cookie", cookiesB)
      .send({ nome: "Invasão", valor: 0, unidade: "Un" });
    expect(res.status).toBe(403);
  });

  it("usuário B não exclui material de A (403)", async () => {
    if (!materialIdA) return;
    const res = await request(app)
      .delete(`/api/materiais/${materialIdA}`)
      .set("Cookie", cookiesB);
    expect(res.status).toBe(403);
  });
});
