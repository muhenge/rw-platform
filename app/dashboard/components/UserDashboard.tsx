import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axiosInstance";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UserTaskList from "./UserTaskList";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Project = {
  id: string;
  name: string;
  description?: string;
};

function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export default function UserDashboard({ user }: { user: any }) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);

  // Fetch user's projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await apiClient.get(`/post/users/${user.id}/projects`);
      return response.data.data || [];
    },
    onSuccess: (data) => {
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    },
    enabled: !!user?.id,
  });

  if (isLoadingProjects) {
    return <DashboardSkeleton />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {selectedProject ? selectedProject.name : 'Task Manager'}
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                {selectedProject?.description || 'Manage your tasks efficiently'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2">
                <UserCircle className="h-4 w-4" />
                {user.firstName || user.email.split('@')[0]}
              </Button>
            </div>
          </header>

          {/* Project Selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {selectedProject ? 'Current Project' : 'Select a Project'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    You don't have any projects yet.
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              ) : (
                <DropdownMenu onOpenChange={setIsProjectMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedProject?.name || 'Select a project'}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
                    {projects.map((project: Project) => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className="cursor-pointer"
                      >
                        <div className="w-full">
                          <div className="font-medium">{project.name}</div>
                          {project.description && (
                            <div className="text-sm text-muted-foreground truncate">
                              {project.description}
                            </div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card>
            <CardContent className="p-0">
              {selectedProject ? (
                <UserTaskList
                  projectId={selectedProject.id}
                  projectName={selectedProject.name}
                />
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {projects.length > 0
                      ? 'Please select a project to view tasks.'
                      : 'Create a project to get started.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
