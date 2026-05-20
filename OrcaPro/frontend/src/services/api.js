import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
    withCredentials: true, // Envia cookies httpOnly automaticamente em todas as requisições
});

// Controla requisições simultâneas durante um refresh em andamento
let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
    failedQueue.forEach(p => error ? p.reject(error) : p.resolve());
    failedQueue = [];
}

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // Não tenta refresh se o erro veio do próprio /refresh ou /login
        const isAuthEndpoint = originalRequest.url === '/refresh' || originalRequest.url === '/login';

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            // Fila as requisições que chegaram durante um refresh já em andamento
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await api.post('/refresh');
                processQueue(null);
                return api(originalRequest); // Repete a requisição original com o novo access token
            } catch (refreshError) {
                processQueue(refreshError);
                localStorage.removeItem('@OrcaPro:user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
