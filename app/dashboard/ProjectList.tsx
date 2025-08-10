"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axiosInstance";
import { useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TaskList from "./components/TaskList";
import { ProjectForm } from "./components/ProjectForm";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  clientId: string;
  clientName?: string;
  teamMembers?: User[];
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: number;
  assigneeIds: string[];
}

interface ProjectListProps {
  initialClients?: any[];
  initialUsers?: any[];
}

export default function ProjectList({ initialClients = [], initialUsers = [] }: ProjectListProps) {
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState<{ [key: string]: string }>({});
  const [taskDetails, setTaskDetails] = useState<{ [key: string]: any }>({});
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Fetch projects with their members
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get('/post/projects/all');
      return response.data.data;
    }
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async ({ projectId, taskData }: { projectId: string; taskData: Task }) => {
      const response = await apiClient.post(`/post/tasks/${projectId}`, {
        title: taskData.title,
        projectId,
        description: taskData.description,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        assigneeIds: taskData.assigneeIds || [],
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Task added successfully');
      setNewTask({});
      setTaskDetails({});
      setActiveProjectId(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      toast.error('Failed to add task', {
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
      toast.success('Task deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      toast.error('Failed to delete task', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, taskData }: { taskId: string; taskData: Task }) => {
      const response = await apiClient.patch(`/post/tasks/${taskId}`, taskData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Task updated successfully');
      setEditingTask(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      toast.error('Failed to update task', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await apiClient.delete(`/post/projects/${projectId}`);
    },
    onSuccess: () => {
      toast.success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      toast.error('Failed to delete project', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  const handleAddTask = (projectId: string) => {
    const taskTitle = newTask[projectId]?.trim();
    if (!taskTitle) return;

    const taskData: Task = {
      title: taskTitle,
      description: taskDetails[projectId]?.description || '',
      dueDate: taskDetails[projectId]?.dueDate,
      priority: taskDetails[projectId]?.priority || 2,
      assigneeIds: taskDetails[projectId]?.assigneeIds || [],
    };

    addTaskMutation.mutate({ projectId, taskData });
  };

  const toggleAssignee = (projectId: string, userId: string) => {
    setTaskDetails(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        assigneeIds: prev[projectId]?.assigneeIds?.includes(userId)
          ? prev[projectId].assigneeIds.filter((id: string) => id !== userId)
          : [...(prev[projectId]?.assigneeIds || []), userId]
      }
    }));
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditTask = (task: Task, projectId: string) => {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || null,
      priority: task.priority || 2,
      assigneeIds: task.assigneeIds || [],
    });
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;

    const taskData: Task = {
      title: editingTask.title,
      description: editingTask.description,
      dueDate: editingTask.dueDate,
      priority: editingTask.priority,
      assigneeIds: editingTask.assigneeIds,
    };

    updateTaskMutation.mutate({
      taskId: editingTask.id,
      taskData,
    });
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (window.confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      deleteProjectMutation.mutate(projectId);
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Workspace</h2>
        <div className="flex items-center space-x-2">
          <ProjectForm
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
            initialClients={initialClients}
            initialUsers={initialUsers}
          />
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No projects found. Create your first project to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project: Project) => (
            <div key={project.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <div className="flex items-center space-x-1">
                    <ProjectForm
                      project={project}
                      mode="edit"
                      onSuccess={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      disabled={deleteProjectMutation.isPending}
                    >
                      {deleteProjectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                >
                  {expandedProject === project.id ? (
                    <Plus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Project details */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {project.description && (
                  <p className="mb-2">{project.description}</p>
                )}
                <div className="flex items-center space-x-4 text-xs">
                  <span>Client: {project.clientName || 'No client'}</span>
                  <span>•</span>
                  <span>Members: {project.teamMembers?.length || 0}</span>
                  <span>•</span>
                  <span>Created: {new Date(project.startDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Task list for this project */}
              <TaskList
                initialProjectId={project.id}
                projectMembers={project.teamMembers?.map((m: User) => ({
                  id: m.id,
                  name: m.name,
                  email: m.email
                })) || []}
              />

              {/* Add task form */}
              {expandedProject === project.id && (
                <div className="mt-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddTask(project.id);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      placeholder="Add a task..."
                      value={newTask[project.id] || ''}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          [project.id]: e.target.value,
                        }))
                      }
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!newTask[project.id]?.trim() || addTaskMutation.isPending}>
                      {addTaskMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Add Task'
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
