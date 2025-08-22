"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axiosInstance";
import { useState } from "react";
import { Plus, Loader2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TaskList from "./components/TaskList";
import { ProjectForm } from "./components/ProjectForm";
import { SafeHtml } from "@/components/ui/safe-html";

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
  members?: User[];
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
  const [viewingDescription, setViewingDescription] = useState<{title: string; content: string} | null>(null);
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

  console.log(projects)

  const { data: projectData } = useQuery({
    queryKey: ['project', activeProjectId], // Use activeProjectId from component state
    queryFn: async () => {
      if (!activeProjectId) return null;
      const response = await apiClient.get(`/post/projects/${activeProjectId}`);
      return response.data;
    },
    enabled: !!activeProjectId, // Only run the query when activeProjectId exists
  });

  // In your component

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async ({ projectId, taskData }: { projectId: string; taskData: Task }) => {
      // Get project members and filter valid assignee IDs
      const projectMembers = projectData?.members || [];
      const validAssigneeIds = taskData.assigneeIds?.filter(assigneeId =>
        projectMembers.some(member => member.id === assigneeId)
      ) || [];

      // If no valid assignees but project has members, assign the current user by default
      const defaultAssigneeIds = validAssigneeIds.length === 0 && projectMembers.length > 0
        ? [projectMembers[0].id] // Assign first member by default, or use your logic
        : validAssigneeIds;

      const requestBody = {
        title: taskData.title,
        projectId,
        description: taskData.description,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined,
        priority: taskData.priority,
        status: taskData.status || 'TODO',
        assigneeIds: defaultAssigneeIds, // Use the filtered assignee IDs
      };

      try {
        const response = await apiClient.post(`/post/tasks/${projectId}`, requestBody);
        return response.data;
      } catch (error) {
        console.error('Error creating task:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Task added successfully');
      setNewTask({});
      setTaskDetails({});
      // Invalidate and refetch the tasks query to update the UI
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error('Failed to create task');
      console.error('Task creation error:', error);
    }
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
      {/* Description View Modal */}
      <Dialog open={!!viewingDescription} onOpenChange={(open) => !open && setViewingDescription(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {viewingDescription?.title || 'Project Description'}
            </DialogTitle>
          </DialogHeader>
          <div className="prose dark:prose-invert max-w-none mt-4">
            <SafeHtml html={viewingDescription?.content || 'No description available.'} />
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Workspace</h2>
        <div className="flex items-center space-x-2">
          <ProjectForm
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
            initialClients={initialClients}
            initialUsers={initialUsers}
            showTrigger={false}
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
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Project details */}
              <div className="text-sm text-gray-600 dark:text-gray-400 px-4">
                {project.description ? (
                  <div className="mb-3">
                    <div className="prose prose-sm dark:prose-invert max-w-none max-h-20 overflow-hidden">
                      <SafeHtml html={project.description} />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingDescription({
                          title: project.name,
                          content: project.description
                        });
                      }}
                    >
                      View Full Description
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No description provided</p>
                )}
                <div className="flex items-center space-x-4 text-xs">
                  <span>Client: {project.clientName || 'No Lead'}</span>
                  <span>•</span>
                  <span>Members: {(project.members || project.teamMembers)?.length || 0}</span>
                  <span>•</span>
                  <span>Created: {new Date(project.startDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Task list for this project */}
              <TaskList
                initialProjectId={project.id}
                projectMembers={(project.members || project.teamMembers)?.map((m: any) => ({
                  id: m.id,
                  firstName: m.firstName || m.name?.split(' ')[0] || 'User',
                  lastName: m.lastName || m.name?.split(' ').slice(1).join(' ') || '',
                  email: m.email || ''
                })) || []}
              />

              {/* Add task form */}
              {activeProjectId === project.id && (
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
