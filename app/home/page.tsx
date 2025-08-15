// app/home/page.tsx
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableHeader, TableHead, TableBody, TableRow } from "@/components/ui/table";

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
    _count?: {
      comments: number;
    };
    comments?: Array<{
      id: string;
      content: string;
      user: {
        firstName: string;
        lastName: string;
      };
      createdAt: string;
    }>;
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

const getStatusPercentage = (status: string): number => {
  switch (status) {
    case 'TODO':
      return 0;
    case 'IN_PROGRESS':
      return 33;
    case 'REVIEW':
      return 66;
    case 'DONE':
    case 'COMPLETED':
      return 100;
    case 'CANCELLED':
      return 0;
    default:
      return 0;
  }
};

const calculateProjectProgress = (tasks: any[] = []) => {
  if (!tasks.length) return 0;

  const statusWeights: Record<string, number> = {
    'TODO': 0,
    'IN_PROGRESS': 0.33,
    'REVIEW': 0.66,
    'DONE': 1,
    'COMPLETED': 1,
    'CANCELLED': 0
  };

  const totalWeight = tasks.reduce((sum, task) => {
    return sum + (statusWeights[task.status] || 0);
  }, 0);

  return Math.round((totalWeight / tasks.length) * 100);
};

export default function HomePage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
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

  // Subscribe to task updates
  useEffect(() => {
    const channel = new BroadcastChannel('task-updates');
    channel.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ['projects-with-progress'] });
    };
    return () => channel.close();
  }, [queryClient]);

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
    refetchOnWindowFocus: true,  // Refetch when window regains focus
    refetchInterval: 30000,      // Refetch every 30 seconds
    refetchIntervalInBackground: false, // Only refetch when tab is active
    staleTime: 10000,            // Data is fresh for 10 seconds
    cacheTime: 5 * 60 * 1000,    // Keep unused data in cache for 5 minutes
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


  console.log('project ----->', projects)
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-muted-foreground">List of all projects</p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 bg-white p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-10 pr-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
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

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gray-100 dark:bg-gray-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px] font-medium text-gray-900 dark:text-gray-100">Project</TableHead>
              <TableHead className="font-medium text-gray-900 dark:text-gray-100">Lead</TableHead>
              <TableHead className="font-medium text-gray-900 dark:text-gray-100">Project Status</TableHead>
              <TableHead className="font-medium text-gray-900 dark:text-gray-100">Tasks Progress</TableHead>
              <TableHead className="font-medium text-gray-900 dark:text-gray-100">Tasks</TableHead>
              <TableHead className="font-medium text-gray-900 dark:text-gray-100">Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <TableRow
                  key={project.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-6">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-300 font-medium">
                          {project.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{project.name}</div>
                        <div className="text-gray-500 dark:text-gray-400">{project.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {project.client?.name || 'No client'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    <Badge
                      variant={project.status === 'COMPLETED' ? 'success' : 'outline'}
                      className={cn(
                        'capitalize',
                        project.status === 'IN_PROGRESS' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                        project.status === 'TODO' && 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                        project.status === 'COMPLETED' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                        project.status === 'ON_HOLD' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                        project.status === 'CANCELLED' && 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
                      )}
                    >
                      {project.status.replace('_', ' ').toLowerCase()}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            project.tasks?.some((t: any) => t.status === 'DONE' || t.status === 'COMPLETED')
                              ? 'bg-green-500'
                              : project.tasks?.some((t: any) => t.status === 'REVIEW')
                                ? 'bg-purple-500'
                                : project.tasks?.some((t: any) => t.status === 'IN_PROGRESS')
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                          )}
                          style={{
                            width: `${calculateProjectProgress(project.tasks)}%`,
                            transition: 'width 0.5s ease-in-out, background-color 0.3s ease-in-out'
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300 w-10">
                        {calculateProjectProgress(project.tasks)}%
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>
                        {project.completedTasks} / {project.totalTasks}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500">•</span>
                      <span className="text-green-600 dark:text-green-400">
                        {project.completedTasks === 0 ? 0 : Math.round((project.completedTasks / project.totalTasks) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MessageSquare className="h-4 w-4" />
                          {project.tasks.reduce((acc, task) => acc + (task.comments?.length || 0), 0) > 0 && (
                            <span className="ml-1 text-xs">{project.tasks.reduce((acc, task) => acc + (task.comments?.length || 0), 0)}</span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end">
                        <div className="p-2">
                          <h4 className="text-sm font-medium mb-2">Comments ({project.tasks.reduce((acc, task) => acc + (task.comments?.length || 0), 0)})</h4>
                          {project.tasks.flatMap(task => task.comments).length > 0 ? (
                            <div className="space-y-3">
                              {project.tasks.flatMap(task => task.comments).map((comment) => (
                                <div key={comment.id} className="text-sm">
                                  <div className="flex items-start gap-2">
                                    <Avatar className="h-8 w-8 mt-0.5">
                                      <AvatarFallback>
                                        {comment.user?.firstName?.[0] || comment.user?.email?.[0]?.toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          {comment.user?.firstName || comment.user?.email?.split('@')[0]}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                                        </span>
                                      </div>
                                      <p className="mt-0.5">{comment.content}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No comments yet</p>
                          )}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No projects found matching your criteria.
                </td>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
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
  );
}
