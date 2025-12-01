// contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

const storageKey = "accessToken";
const getToken = () => localStorage.getItem(storageKey);
const setToken = (token: string) => localStorage.setItem(storageKey, token);
const removeToken = () => localStorage.removeItem(storageKey);

interface User {
  id: number;
  full_name: string;
  email: string;
  role: "student" | "instructor" | "admin" | string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: (redirectPath?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); 

  const loadUserFromToken = async () => {
    setIsLoading(true);
    const storedToken = getToken();

    if (storedToken) {
      setTokenState(storedToken);
      try {
        const response = await api.get("/users/me");
        setUser(response.data.data);
        console.log(user);
      } catch (error) {
        console.error("Token không hợp lệ, đang đăng xuất.", error);

        removeToken();
        setUser(null);
        setTokenState(null);
        router.push("/login");
      }
    } else {
      setUser(null);
      setTokenState(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey) {
        console.log("Phát hiện thay đổi token từ tab khác, đồng bộ lại...");
        loadUserFromToken();
      }
    };

    loadUserFromToken();

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    // (Từ lib/api.ts)
    const handleTokenRefresh = () => {
      console.log("AuthContext: Phát hiện token được refresh (interceptor)...");
      loadUserFromToken();
    };
    window.addEventListener("tokenRefreshed", handleTokenRefresh);
    return () => {
      window.removeEventListener("tokenRefreshed", handleTokenRefresh);
    };
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken); 
    setTokenState(newToken); 
    setUser(newUser);
  };

  const logout = (redirectPath: string = "/login") => {
    removeToken(); 
    setTokenState(null); 
    setUser(null);
    router.push(redirectPath);
  };

  const value = {
    user,
    token: token,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children} 
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
};