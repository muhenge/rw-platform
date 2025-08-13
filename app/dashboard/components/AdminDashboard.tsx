"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axiosInstance";
import { LayoutDashboard, Folder, FileArchive, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ProjectForm } from "./ProjectForm";
import { ReactQueryProvider } from "./ReactQueryProvider";
import { formatDistanceToNow } from 'date-fns';
import StatsCards from "../StatsCards";
import ProjectList from "../ProjectList";
import TeamList from "../TeamList";
import FilesList from "../../signup/FilesList";
import ThemeToggle from "@/lib/ThemeToggle";

// Types
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  name: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch projects data
  const { data: response = { data: [] }, isLoading, error } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const { data } = await apiClient.get("/post/projects/all");
      return data; // The response already has the structure we need
    },
    refetchOnWindowFocus: true,
  });

  // Extract projects from response
  const projects = response?.data || [];

  console.log('Projects data:', projects);

  // Calculate stats based on projects data
  const calculateStats = (): Stats[] => {
    if (!Array.isArray(projects) || projects.length === 0) {
      return [
        { name: "Total Projects", value: 0, trend: 'neutral' },
        { name: "Active Projects", value: 0, trend: 'neutral' },
        { name: "Completed Projects", value: 0, trend: 'neutral' },
        { name: "Upcoming Deadlines", value: 0, trend: 'neutral' },
      ];
    }

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'TODO' || p.status === 'IN_PROGRESS').length;
    const completedProjects = projects.filter(p => p.status === 'DONE').length;
    const upcomingDeadlines = projects.filter(p =>
      p.endDate &&
      new Date(p.endDate) > new Date() &&
      new Date(p.endDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length;

    return [
      { name: "Total Projects", value: totalProjects, trend: totalProjects > 0 ? 'up' : 'neutral' },
      { name: "Active Projects", value: activeProjects, trend: 'neutral' },
      { name: "Completed Projects", value: completedProjects, trend: 'up' },
      { name: "Upcoming Deadlines", value: upcomingDeadlines, trend: 'down' },
    ];
  };

  // Get recent activity (last 5 updated projects)
  const recentActivity = Array.isArray(projects)
    ? [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
    : [];

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">

        <section className="max-w-7xl mx-auto px-4 py-6">
          {/* Stats Cards */}
          <StatsCards stats={calculateStats()} />
          <Tabs
            defaultValue="overview"
            className="space-y-4 mt-8"
            onValueChange={setActiveTab}
            value={activeTab}
          >
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
                {/* <TabsTrigger
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
                </TabsTrigger> */}
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Recent Activity
                  </h3>
                  {isLoading ? (
                    <div className="text-gray-500 dark:text-gray-400">Loading...</div>
                  ) : error ? (
                    <div className="text-red-500">Error loading activity</div>
                  ) : recentActivity.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No recent activity to display.</p>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((project) => (
                        <div key={project.id} className="flex items-start">
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Project <span className="text-indigo-600 dark:text-indigo-400">{project.name}</span> was updated
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('projects')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      Create New Project
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                      View All Projects
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                      Generate Report
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
                <ProjectList projects={projects} />
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
