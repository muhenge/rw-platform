// context/AuthContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient } from "@/lib/axiosInstance";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLogin: string | null;
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('No token found');
      }

      const { data } = await apiClient.get('/user/me');
      setUser(data);

      // Redirect away from auth pages if logged in
      if (['/signin', '/signup'].includes(pathname)) {
        router.push('/dashboard');
      }
    } catch (error) {
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setUser(null);

      // Redirect to signin if not on public page
      if (!['/signin', '/signup'].includes(pathname)) {
        router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/auth/signin', { email, password });

      // Store the token
      localStorage.setItem('token', data.access_token);

      // Set the user data (which now includes the role)
      setUser(data.user);

      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error; // Re-throw to be handled by the calling component
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/signin');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
