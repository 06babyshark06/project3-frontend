import axios from "axios";

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!RAW_BASE_URL) {
  console.warn("Missing NEXT_PUBLIC_API_URL env var, defaulting to localhost");
}
// Fallback for dev if env is missing, but intended to be from env
const API_URL = RAW_BASE_URL || "http://localhost:8081/api/v1";
const STORAGE_KEY = "accessToken";

const getToken = () => typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
const setToken = (token: string) => localStorage.setItem(STORAGE_KEY, token);
const removeToken = () => localStorage.removeItem(STORAGE_KEY);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_URL}/refresh`, {}, { withCredentials: true });
        const newToken = data.access_token;

        setToken(newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        processQueue(null, newToken);

        window.dispatchEvent(new Event("tokenRefreshed"));

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        removeToken();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);