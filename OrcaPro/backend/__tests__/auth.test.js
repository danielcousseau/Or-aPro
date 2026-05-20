const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { criarUsuarioTeste, limparUsuarioTeste, parseCookies, TEST_PREFIX } = require('./helpers');

let userId;

beforeAll(async () => {
    const user = await criarUsuarioTeste('auth');
    userId = user.id;
});

afterAll(async () => {
    await limparUsuarioTeste(userId);
    await prisma.$disconnect();
});

describe('GET /api/health', () => {
    it('responde 200', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });
});

describe('POST /api/registrar', () => {
    let registeredUserId;

    afterAll(async () => {
        if (registeredUserId) await limparUsuarioTeste(registeredUserId);
    });

    it('cria conta com dados válidos', async () => {
        const res = await request(app).post('/api/registrar').send({
            nome: 'Teste Registro',
            usuario: `${TEST_PREFIX}novo`,
            senha: 'senha123',
        });
        expect(res.status).toBe(201);
        const user = await prisma.user.findUnique({ where: { usuario: `${TEST_PREFIX}novo` } });
        expect(user).not.toBeNull();
        registeredUserId = user.id;
    });

    it('rejeita usuário duplicado', async () => {
        const res = await request(app).post('/api/registrar').send({
            nome: 'Duplicado',
            usuario: `${TEST_PREFIX}auth`, // já existe
            senha: 'senha123',
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/usuário já está em uso/i);
    });
});

describe('POST /api/login', () => {
    it('autentica com credenciais válidas e seta cookies', async () => {
        const res = await request(app).post('/api/login').send({
            usuario: `${TEST_PREFIX}auth`,
            senha: 'senha123',
        });
        expect(res.status).toBe(200);
        expect(res.body.user.usuario).toBe(`${TEST_PREFIX}auth`);
        const cookies = parseCookies(res);
        expect(cookies.some(c => c.startsWith('token='))).toBe(true);
        expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
    });

    it('rejeita senha incorreta com 401', async () => {
        const res = await request(app).post('/api/login').send({
            usuario: `${TEST_PREFIX}auth`,
            senha: 'senhaErrada',
        });
        expect(res.status).toBe(401);
    });

    it('rejeita usuário inexistente com 401', async () => {
        const res = await request(app).post('/api/login').send({
            usuario: 'nao_existe_mesmo',
            senha: 'senha123',
        });
        expect(res.status).toBe(401);
    });
});

describe('GET /api/me', () => {
    it('retorna perfil com cookie válido', async () => {
        const loginRes = await request(app).post('/api/login').send({
            usuario: `${TEST_PREFIX}auth`,
            senha: 'senha123',
        });
        const cookies = parseCookies(loginRes);

        const res = await request(app).get('/api/me').set('Cookie', cookies);
        expect(res.status).toBe(200);
        expect(res.body.usuario).toBe(`${TEST_PREFIX}auth`);
    });

    it('retorna 401 sem cookie', async () => {
        const res = await request(app).get('/api/me');
        expect(res.status).toBe(401);
    });
});
