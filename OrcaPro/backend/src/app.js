const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app = express();
app.set('trust proxy', 1);

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
    origin: allowedOrigin,
    credentials: true,
    optionsSuccessStatus: 200,
}));

app.use(helmet());
app.use(cookieParser());
app.use(express.json());

const isTest = process.env.NODE_ENV === 'test';

if (!isTest) {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        message: { error: 'Atividade suspeita detectada. Muitas requisições feitas por este IP. Tente novamente mais tarde.' },
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api', limiter);
}

const authLimiter = isTest
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
        standardHeaders: true,
        legacyHeaders: false,
    });

const clienteRoutes = require('./routes/clienteRoutes');
const materialRoutes = require('./routes/materialRoutes');
const orcamentoRoutes = require('./routes/orcamentoRoutes');
const auditRoutes = require('./routes/auditRoutes');
const AuthController = require('./controllers/AuthController');
const authMiddleware = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API do OrcaPro rodando!' });
});

app.post('/api/login', authLimiter, AuthController.login);
app.post('/api/registrar', authLimiter, AuthController.register);
app.post('/api/refresh', AuthController.refresh);
app.post('/api/forgot-password', authLimiter, AuthController.forgotPassword);
app.post('/api/reset-password', AuthController.resetPassword);

app.get('/api/me', authMiddleware, AuthController.me);
app.post('/api/logout', authMiddleware, AuthController.logout);
app.put('/api/usuarios/perfil', authMiddleware, AuthController.atualizarPerfil);
app.put('/api/usuarios/senha', authMiddleware, AuthController.alterarSenha);

app.use('/api/clientes', clienteRoutes);
app.use('/api/materiais', materialRoutes);
app.use('/api/orcamentos', orcamentoRoutes);
app.use('/api/audit-log', auditRoutes);

const { buscarPendentes } = require('./services/telegram');
app.get('/api/telegram/pendentes', authMiddleware, async (req, res) => {
    const mensagens = await buscarPendentes();
    res.json(mensagens);
});

app.use(errorHandler);

module.exports = app;
