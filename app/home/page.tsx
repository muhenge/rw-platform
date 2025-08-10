// app/home/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axiosInstance";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  description: string;
  code: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'REVIEW' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  clientId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
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
    description: string | null;
    status: string;
    priority: number;
    dueDate: string | null;
    projectId: string;
    createdById: string;
    parentTaskId: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    assignees: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    }>;
    assignee: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
};

type ApiResponse = {
  data: Project[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export default function HomePage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const limit = 10;

  // Handle client-side redirects
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/signin?redirect=${encodeURIComponent('/home')}`);
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: ['projects-with-progress', { page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const { data } = await apiClient.get(`/post/projects/with-progress?${params}`);
      console.log('API Response:', data); // Debug log
      return data;
    },
    onSuccess: (data) => {
      console.log('Projects with statuses:', data.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        statusType: typeof p.status
      })));
    },
    enabled: isAuthenticated,
    keepPreviousData: true,
  });

  const projects = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  // Filter projects based on search term and status
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" ||
        project.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-muted-foreground">List of all projects</p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 bg-white p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
            <Input
              type="text"
              placeholder="Search projects..."
              className="pl-10 bg-gray-800 text-white placeholder:text-gray-400 border-gray-700 focus-visible:ring-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500">{project.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{project.client?.name || '—'}</div>
                      <div className="text-sm text-gray-500">{project.client?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={project.status === 'DONE' ? 'default' : 'outline'}
                        className={cn(
                          project.status === 'TODO' ? 'bg-yellow-100 text-yellow-800' : '',
                          project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : '',
                          project.status === 'DONE' ? 'bg-green-100 text-green-800' : '',
                          project.status === 'REVIEW' ? 'bg-purple-100 text-purple-800' : '',
                          project.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''
                        )}
                      >
                        {project.status === 'IN_PROGRESS' ? 'In Progress' :
                          project.status === 'TODO' ? 'To Do' :
                            project.status.charAt(0) + project.status.slice(1).toLowerCase().replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full"
                          style={{
                            width: `${project.progress}%`,
                            backgroundColor:
                              project.progress < 30 ? '#ef4444' :
                                project.progress < 70 ? '#f59e0b' : '#10b981'
                          }}
                        />
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{Math.round(project.progress)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {project.completedTasks} / {project.totalTasks}
                      </div>
                      <div className="text-sm text-gray-500">
                        {project.pendingTasks} pending
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.members.length} members
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(project.updatedAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No projects found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">
              {filteredProjects.length > 0 ? (page - 1) * limit + 1 : 0}
            </span> to{' '}
            <span className="font-medium">
              {Math.min(page * limit, filteredProjects.length)}
            </span>{' '}
            of <span className="font-medium">{filteredProjects.length}</span> projects
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((old) => Math.max(old - 1, 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((old) => old + 1)}
              disabled={page >= meta.totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
