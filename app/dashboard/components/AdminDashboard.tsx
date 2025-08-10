"use client";
import StatsCards from "../StatsCards";
import ProjectList from "../ProjectList";
import TeamList from "../TeamList";
import FilesList from "../../signup/FilesList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Folder, Users, FileArchive } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "@/lib/ThemeToggle";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ProjectForm } from "./ProjectForm";
import { ReactQueryProvider } from "./ReactQueryProvider";
const stats = [
  { name: "Total Projects", value: "12" },
  { name: "Tasks Due", value: "8" },
  { name: "Completed Tasks", value: "24" },
  { name: "Upcoming Deadlines", value: "3" },
];

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <ProtectedRoute>
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-200 font-medium">
              {user.firstName?.[0] || user.email[0]}
            </div>
            <div className="ml-2 text-sm text-left">
              <div className="font-medium text-gray-700 dark:text-gray-200">{user.firstName} {user.lastName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role.toLowerCase()}</div>
            </div>
          </div>
        </div>
      </header>
      <section className="max-w-7xl mx-auto px-4 py-6">
        <StatsCards stats={stats} />
        <Tabs defaultValue="overview" className="space-y-4 mt-8" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList className="bg-gray-100 dark:bg-gray-800">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                <LayoutDashboard className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                <Folder className="h-4 w-4" /> Projects
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                <Users className="h-4 w-4" /> Team
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                <FileArchive className="h-4 w-4" /> Files
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <p className="text-gray-600 dark:text-gray-300">No recent activity to display.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                    Create New Project
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                    Invite Team Member
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

            <TabsContent value="projects">
              <ReactQueryProvider>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Projects</h2>
                  <ProjectForm />
                </div>
                <ProjectList />
              </ReactQueryProvider>
            </TabsContent>

          <TabsContent value="team">
            <TeamList />
          </TabsContent>

          <TabsContent value="files">
            <FilesList />
          </TabsContent>
        </Tabs>
      </section>
    </main>
    </ProtectedRoute>
  );
}
