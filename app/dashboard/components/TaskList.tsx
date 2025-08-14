"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axiosInstance";
import { useState } from "react";
import { Loader2, Search, Filter, X, Plus, Trash2, Pencil, Calendar, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TaskListProps {
  initialProjectId?: string;
  projectMembers?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

export default function TaskList({ initialProjectId, projectMembers = [] }: TaskListProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    projectId: initialProjectId || "",
  });
  const [page, setPage] = useState(1);
  const [viewingTask, setViewingTask] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: null as Date | null,
    priority: 2,
    assigneeIds: [] as string[],
  });
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const limit = 10;

  // Fetch all tasks with filters and pagination
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tasks", { ...filters, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.projectId) params.append("projectId", filters.projectId);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await apiClient.get(`/post/tasks?${params.toString()}`);
      return response.data;
    },
    refetchOnWindowFocus: true,
    enabled: !!user?.id,
  });

  const tasks = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 10 };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiClient.post(`/post/tasks/${filters.projectId}`, taskData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Task created successfully");
      setIsCreatingTask(false);
      setNewTask({
        title: "",
        description: "",
        dueDate: null,
        priority: 2,
        assigneeIds: [],
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to create task", {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, taskData }: { taskId: string; taskData: any }) => {
      const response = await apiClient.patch(`/post/tasks/${taskId}`, {
        ...taskData,
        dueDate: taskData.dueDate?.toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Task updated successfully");
      setEditingTask(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      toast.error("Failed to update task", {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiClient.delete(`/post/tasks/${taskId}`);
    },
    onSuccess: () => {
      toast.success("Task deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      toast.error("Failed to delete task", {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1); // Reset to first page when filters change
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    const taskData = {
      title: newTask.title,
      description: newTask.description,
      dueDate: newTask.dueDate?.toISOString(),
      priority: newTask.priority,
      assigneeIds: newTask.assigneeIds,
    };

    createTaskMutation.mutate(taskData);
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;

    const taskData = {
      title: editingTask.title,
      description: editingTask.description,
      dueDate: editingTask.dueDate,
      priority: editingTask.priority,
      status: editingTask.status,
      assigneeIds: editingTask.assigneeIds,
    };

    updateTaskMutation.mutate({ taskId: editingTask.id, taskData });
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const toggleAssignee = (userId: string, isEditing: boolean = false) => {
    if (isEditing) {
      setEditingTask(prev => ({
        ...prev,
        assigneeIds: prev.assigneeIds.includes(userId)
          ? prev.assigneeIds.filter((id: string) => id !== userId)
          : [...prev.assigneeIds, userId]
      }));
    } else {
      setNewTask(prev => ({
        ...prev,
        assigneeIds: prev.assigneeIds.includes(userId)
          ? prev.assigneeIds.filter(id => id !== userId)
          : [...prev.assigneeIds, userId]
      }));
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500';
      case 3: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'DONE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold">
          {initialProjectId ? 'Project Tasks' : 'All Tasks'}
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => {
              if (!initialProjectId) {
                toast.error("Please select a project first");
                return;
              }
              setIsCreatingTask(true);
            }}
            disabled={!initialProjectId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
              onClick={() => handleFilterChange("search", "")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange("status", value === 'ALL' ? '' : value)}
        >
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No tasks found. {!initialProjectId ? 'Select a project to add tasks.' : 'Create your first task.'}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task: any) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                      P{task.priority}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Project:</span>
                      <span className="ml-1">{task.project?.name || "N/A"}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <span className="mx-2">•</span>
                        <span>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {task.assignees?.slice(0, 3).map((user: any) => (
                        <div
                          key={user.id}
                          className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs border-2 border-white dark:border-gray-800"
                          title={`${user.firstName} ${user.lastName}`}
                        >
                          {user.firstName[0]}
                          {user.lastName?.[0]}
                        </div>
                      ))}
                      {task.assignees?.length > 3 && (
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-xs border-2 border-white dark:border-gray-800">
                          +{task.assignees.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingTask(task)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTask({
                            id: task.id,
                            title: task.title,
                            description: task.description || '',
                            dueDate: task.dueDate ? new Date(task.dueDate) : null,
                            priority: task.priority || 2,
                            status: task.status || 'TODO',
                            assigneeIds: task.assignees?.map((a: any) => a.id) || [],
                          });
                        }}
                        disabled={updateTaskMutation.isPending}
                      >
                        {updateTaskMutation.isPending && updateTaskMutation.variables?.taskId === task.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Pencil className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={deleteTaskMutation.isPending && deleteTaskMutation.variables === task.id}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      >
                        {deleteTaskMutation.isPending && deleteTaskMutation.variables === task.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {meta.total > limit && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500">
              Showing {Math.min((page - 1) * limit + 1, meta.total)}-{
                Math.min(page * limit, meta.total)
              } of {meta.total} tasks
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= meta.total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreatingTask} onOpenChange={setIsCreatingTask}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Task description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newTask.dueDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {newTask.dueDate ? (
                        format(newTask.dueDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComp
                      mode="single"
                      selected={newTask.dueDate || undefined}
                      onSelect={(date) => setNewTask(prev => ({ ...prev, dueDate: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTask.priority.toString()}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: parseInt(value) }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">High</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assignees</Label>
              <div className="flex flex-wrap gap-2">
                {projectMembers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleAssignee(user.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer",
                      newTask.assigneeIds.includes(user.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                      {user?.firstName?.[0]?.toUpperCase() || ''}{user?.lastName?.[0]?.toUpperCase() || '' || '?'}
                    </div>
                    <span>
                      {user?.firstName || 'Unknown'} {user?.lastName || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreatingTask(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {editingTask && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editingTask.dueDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {editingTask.dueDate ? (
                            format(editingTask.dueDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComp
                          mode="single"
                          selected={editingTask.dueDate || undefined}
                          onSelect={(date) => setEditingTask({ ...editingTask, dueDate: date || null })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={editingTask.priority.toString()}
                      onValueChange={(value) => setEditingTask({ ...editingTask, priority: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">High</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editingTask.status}
                      onValueChange={(value) => setEditingTask({ ...editingTask, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Assignees</Label>
                  <div className="flex flex-wrap gap-2">
                    {projectMembers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => toggleAssignee(user.id, true)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer",
                          editingTask.assigneeIds.includes(user.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                        )}
                      >
                        <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                          {user?.firstName?.[0]?.toUpperCase() || ''}{user?.lastName?.[0]?.toUpperCase() || '' || '?'}
                        </div>
                        <span>
                          {user?.firstName || 'Unknown'} {user?.lastName || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTask(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUpdateTask}
                    disabled={updateTaskMutation.isPending}
                  >
                    {updateTaskMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Save Changes
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog open={!!viewingTask} onOpenChange={(open) => !open && setViewingTask(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {viewingTask && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingTask.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn("text-xs", getPriorityColor(viewingTask.priority))}>
                    Priority {viewingTask.priority}
                  </Badge>
                  <Badge className={cn("text-xs capitalize", getStatusColor(viewingTask.status))}>
                    {viewingTask.status.toLowerCase().replace('_', ' ')}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                {viewingTask.description && (
                  <div>
                    <h4 className="font-medium mb-1">Description</h4>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {viewingTask.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {viewingTask.dueDate && (
                    <div>
                      <h4 className="font-medium mb-1">Due Date</h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {format(new Date(viewingTask.dueDate), 'PPP')}
                      </p>
                    </div>
                  )}
                  {viewingTask.project && (
                    <div>
                      <h4 className="font-medium mb-1">Project</h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {viewingTask.project.name}
                      </p>
                    </div>
                  )}
                </div>

                {viewingTask.assignees && viewingTask.assignees.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Assignees</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingTask.assignees.map((user: any) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                        >
                          <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                            {user?.firstName?.[0]?.toUpperCase() || ''}{user?.lastName?.[0]?.toUpperCase() || '' || '?'}
                          </div>
                          <span>
                            {user?.firstName || 'Unknown'} {user?.lastName || ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
