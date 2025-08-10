import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function ManagerDashboard({ user }: { user: any }) {
  return (
    <ProtectedRoute>
    <main className="min-h-screen bg-gray-100 text-gray-900 p-10">
      <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
      <p>Welcome, <strong>{user.firstName || user.email}</strong>!</p>
      {/* You can now add widgets, tables, etc. */}
    </main>
    </ProtectedRoute>
  );
}
