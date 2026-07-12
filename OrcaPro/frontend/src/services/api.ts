import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || "http://localhost:3333/api";
  }
  // App nativo (Capacitor) não passa pelo proxy /api do Vercel
  const isNativeApp =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.protocol === "capacitor:");
  if (isNativeApp) {
    return (
      import.meta.env.VITE_API_URL || "https://orcapro-api.onrender.com/api"
    );
  }
  return "/api";
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

let accessToken: string | null = null;

export function setAccessToken(token: string): void {
  accessToken = token;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;

interface QueueItem {
  resolve: () => void;
  reject: (error: unknown) => void;
}
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown): void {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;
    const isAuthEndpoint =
      originalRequest.url === "/refresh" || originalRequest.url === "/login";

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefresh = localStorage.getItem("@OrcaPro:refreshToken");
        const response = await api.post("/refresh", {
          refreshToken: storedRefresh,
        });
        accessToken = response.data.accessToken;
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        accessToken = null;
        localStorage.removeItem("@OrcaPro:user");
        localStorage.removeItem("@OrcaPro:refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
