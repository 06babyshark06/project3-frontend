import axios from "axios";

const BASE_URL = "http://localhost:8081/api/v1";
const STORAGE_KEY = "accessToken";

const getToken = () => localStorage.getItem(STORAGE_KEY);
const setToken = (token: string) => localStorage.setItem(STORAGE_KEY, token);
const removeToken = () => localStorage.removeItem(STORAGE_KEY);

export const api = axios.create({
  baseURL: BASE_URL, 
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResponse = await axios.post("http://localhost:8081/api/v1/refresh", {}, {
          withCredentials: true
        });
        
        const { access_token: newAccessToken } = refreshResponse.data;

        setToken(newAccessToken); 

        window.dispatchEvent(new Event("tokenRefreshed"));

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error("Refresh token hết hạn!", refreshError);
        removeToken();
        window.location.href = '/login'; 
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);