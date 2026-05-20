require('dotenv').config();

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
    console.error(`FATAL: Variáveis de ambiente não definidas: ${missingEnv.join(', ')}`);
    process.exit(1);
}

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
    credentials: true, // Obrigatório para o browser enviar cookies cross-origin
    optionsSuccessStatus: 200,
}));

app.use(helmet());
app.use(cookieParser()); // Popula req.cookies para leitura dos tokens httpOnly
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { error: 'Atividade suspeita detectada. Muitas requisições feitas por este IP. Tente novamente mais tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Rate limit agressivo para login/registro — 10 tentativas por 15 min por IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const clienteRoutes = require('./routes/clienteRoutes');
const materialRoutes = require('./routes/materialRoutes');
const orcamentoRoutes = require('./routes/orcamentoRoutes');
const AuthController = require('./controllers/AuthController');
const authMiddleware = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API do OrcaPro rodando!' });
});

// Rotas públicas de autenticação
app.post('/api/login', authLimiter, AuthController.login);
app.post('/api/registrar', authLimiter, AuthController.register);
app.post('/api/refresh', AuthController.refresh);
app.post('/api/forgot-password', authLimiter, AuthController.forgotPassword);
app.post('/api/reset-password', AuthController.resetPassword);

// Rotas privadas de perfil
app.get('/api/me', authMiddleware, AuthController.me);
app.post('/api/logout', authMiddleware, AuthController.logout);
app.put('/api/usuarios/perfil', authMiddleware, AuthController.atualizarPerfil);
app.put('/api/usuarios/senha', authMiddleware, AuthController.alterarSenha);

app.use('/api/clientes', clienteRoutes);
app.use('/api/materiais', materialRoutes);
app.use('/api/orcamentos', orcamentoRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
