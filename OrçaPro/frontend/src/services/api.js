import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api', // Usa a URL da Vercel ou localhost no dev
});

// Interceptador de Requisição
api.interceptors.request.use(async config => {
    // Pega o token que foi salvo no LocalStorage no momento do login
    const token = localStorage.getItem('@OrcaPro:token');
    
    // Se existir token, coloca no cabeçalho (Header) da requisição
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
});

// Interceptador de Resposta
api.interceptors.response.use(
    response => response, // Se a requisição deu certo, só repassa
    error => {
        // Se o backend devolver 401 (Não Autorizado / Token Expirado)
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('@OrcaPro:token'); // Apaga o crachá vencido
            window.location.href = '/login'; // Chuta de volta pro login
        }
        return Promise.reject(error);
    }
);

export default api;