require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // [SecOps] Proteção avançada de cabeçalhos HTTP
const rateLimit = require('express-rate-limit'); // [SecOps] Bloqueio contra ataques de repetição

const app = express();

// [SecOps] Protegendo o CORS. 'origin: *' permite que qualquer site tente se comunicar com sua API.
// É vital restringir isso para o domínio exato do seu frontend para evitar ataques cruzados.
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
    origin: allowedOrigin,
    optionsSuccessStatus: 200 // Algumas versões antigas de navegadores engasgam com 204
}));

// [SecOps] Oculta informações do servidor e previne ataques XSS e Sniffing
app.use(helmet());

app.use(express.json());

// [SecOps] Limitador de requisições. Se um IP fizer mais de 300 chamadas em 15 min, é bloqueado.
// Impede que robôs derrubem o servidor (DDoS) ou façam varreduras de falhas.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Janela de 15 minutos
    max: 300, 
    message: { error: 'Atividade suspeita detectada. Muitas requisições feitas por este IP. Tente novamente mais tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplica a proteção em todas as rotas da API
app.use('/api', limiter);

// Importando as Rotas
const clienteRoutes = require('./routes/clienteRoutes');
const materialRoutes = require('./routes/materialRoutes');
const orcamentoRoutes = require('./routes/orcamentoRoutes'); // <-- ADICIONE ISSO
const AuthController = require('./controllers/AuthController');

// Rota de Teste
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API do OrcaPro rodando perfeitamente! 🚀' });
});

// Usando as Rotas
// Rota de Login (Pública) - Tem que vir antes das rotas fechadas!
app.post('/api/login', AuthController.login);

app.use('/api/clientes', clienteRoutes);
app.use('/api/materiais', materialRoutes);
app.use('/api/orcamentos', orcamentoRoutes); // <-- E ADICIONE ISSO AQUI

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} 🚀`);
});