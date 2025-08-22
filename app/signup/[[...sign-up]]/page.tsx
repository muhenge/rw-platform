"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/axiosInstance";
import { useTheme } from "@/lib/ThemeProvider";
import Link from "next/link";
import AdminRoute from "@/components/auth/AdminRoute";

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
    role: string;
    firstName: string;
    lastName: string;
  };
  message: string;
  token?: string;
}

function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: "",
    lastName: "",
    email: searchParams?.get("email") || "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newlyRegisteredUser, setNewlyRegisteredUser] = useState<{email: string, name: string} | null>(null);


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
    setError(null);
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post<SignUpResponse>("/auth/register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      setSuccess(true);
      setNewlyRegisteredUser({
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`.trim()
      });
      
      // Reset form for next registration
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
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

        {success && newlyRegisteredUser && (
          <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">User created successfully!</p>
                <p>{newlyRegisteredUser.name} ({newlyRegisteredUser.email}) has been registered.</p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="ml-4 px-3 py-1 text-sm bg-white text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
            {error}
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
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Creating account...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Dashboard
              </button>
            </div>
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

export default function SignUpPage() {
  return (
    <AdminRoute>
      <SignUpPageContent />
    </AdminRoute>
  );
}
