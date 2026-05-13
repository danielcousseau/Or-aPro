require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

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