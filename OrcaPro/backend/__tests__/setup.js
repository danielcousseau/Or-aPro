require('dotenv').config();

// Garante JWT_SECRET mínimo para testes sem .env
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test_secret_orcapro';
