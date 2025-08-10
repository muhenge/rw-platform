// app/home/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from 'use-debounce';

type Project = {
  id: string;
  name: string;
  description?: string;
  code: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
  members: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
    dueDate?: string;
    assignee?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
};

export default function HomePage() {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch] = useDebounce(searchInput, 500);

  // Handle client-side redirects
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/signin?redirect=${encodeURIComponent('/home')}`);
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    assigneeId: '',
    clientId: '',
    page: 1,
    limit: 9, // 3x3 grid
  });

  const { data: response = { data: [], meta: { total: 0, page: 1, limit: 9, totalPages: 1 } }, isLoading } = useQuery<ApiResponse>({
  queryKey: ['all-projects-with-progress', { ...filters, search: debouncedSearch }],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: filters.page.toString(),
      limit: filters.limit.toString(),
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(filters.status && filters.status !== 'ALL' && { status: filters.status }),
      ...(filters.assigneeId && { assigneeId: filters.assigneeId === 'me' ? user?.id || '' : filters.assigneeId }),
    });

    const { data } = await apiClient.get(`/post/projects/with-progress?${params}`);
    return data;
  },
  enabled: isAuthenticated,
});

  // Show loading state
  if (isAuthLoading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Project Feed</h1>
          <p className="text-muted-foreground">
            Overview of all projects and their progress
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search projects..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Select
                value={filters.status || 'ALL'}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  status: value === 'ALL' ? '' : value,
                  page: 1
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">In Review</SelectItem>
                  <SelectItem value="DONE">Completed</SelectItem>
                </SelectContent>
              </Select>

              
            </div>
          </div>
        </div>

        {response.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {response.data?.map((project) => (
              <Card key={project.id} className="w-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  {project.description && (
                    <p className="text-muted-foreground text-sm">{project.description}</p>
                  )}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Project Code</span>
                      <span className="font-medium">{project.code}</span>
                    </div>
                    {project.client && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Client</span>
                        <span className="font-medium">{project.client.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tasks</span>
                      <span>{project.completedTasks} / {project.totalTasks} completed</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Team Members</span>
                      <span>{project.members.length}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  Updated {format(new Date(project.updatedAt), 'MMM d, yyyy')}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
