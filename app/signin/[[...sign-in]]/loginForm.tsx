"use client";
import { SignIn, useAuth, useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("localhost:3005/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    console.log(res.headers)
    if (!res.ok) {
      setError(data.message || "Login failed");
      return;
    }
    window.location.href = "/dashboard";
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
                  redirectPageLink: 'hidden',
                  redirectPageButton: 'hidden',
                },
              }}
            />
          </SignedOut>
          <SignedIn>
            <div className="text-center text-lg">Redirecting to your dashboard...</div>
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
          <button type="submit" className="bg-indigo-600 text-white w-full py-2 rounded-md">
            Sign In
          </button>
          {error && <div className="text-red-500">{error}</div>}
        </form>
      </div>
    </div>
  );
}
