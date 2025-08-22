"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (user?.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
