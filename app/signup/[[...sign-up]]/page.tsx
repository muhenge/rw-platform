"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/axiosInstance";
import { useTheme } from "@/lib/ThemeProvider";
import Link from "next/link";

interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  message: string;
  token?: string;
}

export default function SignUpPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const message = searchParams.get('message');

  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (error) setError("");
  };

  const validateForm = (): boolean => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...signUpData } = formData;

      const { data } = await apiClient.post<SignUpResponse>("/auth/register", signUpData);

      if (data.token) {
        localStorage.setItem("token", data.token);

        router.push(redirectTo);
      } else {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          router.push(`/signin?message=Account created successfully`);
        }, 2000);
      }

    } catch (err: any) {
      console.error("Sign up error:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 409) {
        setError("An account with this email already exists");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full space-y-8 p-8 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center">
          <h2 className={`mt-6 text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Create your account
          </h2>
          <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Join us and start managing your projects
          </p>
        </div>

        {message && (
          <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="sr-only">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:z-10 sm:text-sm ${theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-offset-gray-800'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-offset-white'
                    }`}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="sr-only">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:z-10 sm:text-sm ${theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-offset-gray-800'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-offset-white'
                    }`}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
                className={`relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-offset-gray-800'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-offset-white'
                  }`}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleInputChange}
                className={`relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-offset-gray-800'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-offset-white'
                  }`}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-offset-gray-800'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-offset-white'
                  }`}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${theme === 'dark' ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Already have an account?{' '}
            <Link
              href="/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
