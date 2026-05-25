"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
    console.error(`FATAL: Variáveis de ambiente não definidas: ${missingEnv.join(', ')}`);
    process.exit(1);
}
const app = require("./app");
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
