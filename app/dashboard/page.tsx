// app/dashboard/page.tsx
"use client";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "./components/AdminDashboard";
import ManagerDashboard from "./components/ManagerDashboard";
import ConsultantDashboard from "./components/ConsultantDashboard";
import UserDashboard from "./components/UserDashboard";
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Handle client-side redirects
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/signin?redirect=${encodeURIComponent('/dashboard')}`);
      } else if (user?.role === "MANAGER") {
        // Managers should be redirected to home
        router.push('/home');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If not authenticated or manager, this will redirect in the useEffect
  if (!isAuthenticated || user?.role === "MANAGER") {
    return null;
  }

  // Now we can safely access user.role since it's included in the login response
  const { role } = user;

  switch (role) {
    case "ADMIN":
      return <AdminDashboard user={user} />;
    case "CONSULTANT":
      return <ConsultantDashboard user={user} />;
    case "MANAGER":
      return <ManagerDashboard user={user} />;
    case "USER":
    default:
      return <UserDashboard user={user} />;
  }
}
