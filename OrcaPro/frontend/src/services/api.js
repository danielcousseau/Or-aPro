import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
    withCredentials: true,
});

// Access token fica em memória (nunca no DOM/localStorage — reduz superfície XSS)
let accessToken = null;

export function setAccessToken(token) {
    accessToken = token;
}

// Injeta o header em toda requisição quando o token estiver disponível
api.interceptors.request.use(config => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

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
        const isAuthEndpoint = originalRequest.url === '/refresh' || originalRequest.url === '/login';

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
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
                // Envia refreshToken pelo body (funciona no Safari/iOS que bloqueia cookies cross-domain)
                const storedRefresh = localStorage.getItem('@OrcaPro:refreshToken');
                const response = await api.post('/refresh', { refreshToken: storedRefresh });
                accessToken = response.data.accessToken;
                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                accessToken = null;
                localStorage.removeItem('@OrcaPro:user');
                localStorage.removeItem('@OrcaPro:refreshToken');
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
