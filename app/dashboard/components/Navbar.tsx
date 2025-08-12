// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserIcon, Home, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "@/lib/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't show navbar on auth pages
  if (['/signin', '/signup'].includes(pathname)) {
    return null;
  }

  // Show loading skeleton while auth state is loading
  if (isLoading || !isMounted) {
    return (
      <nav className="border-b">
        <div className="container h-16 flex items-center justify-between">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </nav>
    );
  }

  // If not authenticated, don't show the navbar
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/signin');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link
            href={user?.role === "MANAGER" ? "/home" : "/dashboard"}
            className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
          >
            <Image
              src="/Hesed-Advocates.png"  // Make sure this image is in your public folder
              alt="Hesed Advocates Logo"
              width={40}
              height={40}
              className="h-10 w-10"  // Adjust size as needed
            />
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg leading-tight">HESED</span>
              <span className="text-[#f6b93b] text-sm leading-tight">ADVOCATES</span>
            </div>
          </Link>

          {user?.role !== "MANAGER" && (
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${pathname.startsWith("/dashboard") ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}

          <Link
            href="/home"
            className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${pathname === "/home" ? "text-primary" : "text-muted-foreground"
              }`}
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.firstName || "User"} />
                  <AvatarFallback>
                    {user?.firstName?.[0] || <UserIcon className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
