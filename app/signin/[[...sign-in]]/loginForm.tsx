"use client";
import { SignIn, useAuth, useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { useState } from "react";
import { apiClient } from "@/lib/axiosInstance";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/signin", {
        email,
        password
      });

      if (response.data.token) {
        // Store the token in localStorage
        localStorage.setItem("token", response.data.token);
        // Redirect to dashboard on successful login
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to Manage
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please sign in to your account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <SignedOut>
            <SignIn
              appearance={{
                elements: {
                  card: 'bg-transparent shadow-none',
                  headerTitle: 'text-xl font-bold text-gray-900',
                  headerSubtitle: 'text-sm text-gray-600',
                  formFieldInput: 'focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md',
                  formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
                  footerAction: 'hidden',
                  footerActionLink: 'hidden',
                  socialButtonsBlockButton: 'border-gray-300 text-gray-700 hover:bg-gray-50',
                },
              }}
              afterSignInUrl="/dashboard"
              afterSignUpUrl="/dashboard"
            />
          </SignedOut>

          <SignedIn>
            <div className="text-center">
              <p className="text-sm text-gray-600">You are already signed in.</p>
              <a
                href="/dashboard"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Dashboard
              </a>
            </div>
          </SignedIn>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="block w-full border-gray-300 rounded-md p-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="block w-full border-gray-300 rounded-md p-2"
          />
          <button type="submit" disabled={isLoading} className="bg-indigo-600 text-white w-full py-2 rounded-md">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
