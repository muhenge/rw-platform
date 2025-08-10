"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axiosInstance";
import { useState } from "react";
import { Plus, Loader2, X, Calendar, User as UserIcon, Flag, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskList from "./components/TaskList";
import { ProjectForm } from "./components/ProjectForm";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function ProjectList() {
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState<{ [key: string]: string }>({});
  const [taskDetails, setTaskDetails] = useState<{ [key: string]: any }>({});
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<{
    id: string;
    projectId: string;
    title: string;
    description: string;
    dueDate: string | null;
    priority: number;
    assigneeIds: string[];
  } | null>(null);
  const [editingProject, setEditingProject] = useState<any>(null);

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
    mutationFn: async ({ projectId, taskData }: { projectId: string; taskData: any }) => {
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
    mutationFn: async ({ taskId, taskData }: { taskId: string; taskData: any }) => {
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

    const taskData = {
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

  const handleEditTask = (task: any, projectId: string) => {
    setEditingTask({
      id: task.id,
      projectId,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || null,
      priority: task.priority || 2,
      assigneeIds: task.assignees?.map((a: any) => a.id) || [],
    });
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;

    const taskData = {
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
      <Tabs defaultValue="projects" className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Workspace</h2>
          <div className="flex items-center space-x-2">
            <ProjectForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['projects'] })} />
            <TabsList>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="tasks">All Tasks</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="projects" className="space-y-6">
          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No projects found. Create your first project to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
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
                        <X className="h-4 w-4" />
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
                      <span>Client: {project.client?.name || 'No client'}</span>
                      <span>•</span>
                      <span>Members: {project.members?.length || 0}</span>
                      <span>•</span>
                      <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Task list for this project */}
                  <TaskList
                    initialProjectId={project.id}
                    projectMembers={project.members?.map((m: any) => ({
                      id: m.id,
                      firstName: m.firstName,
                      lastName: m.lastName,
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
                        <Input
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
        </TabsContent>

        <TabsContent value="tasks">
          <TaskList />
        </TabsContent>
      </Tabs>

      {/* Existing modals and dialogs */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingTask?.title || ''}
                  onChange={(e) =>
                    setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingTask?.description || ''}
                  onChange={(e) =>
                    setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)
                  }
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
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {editingTask?.dueDate ? (
                          format(new Date(editingTask.dueDate), 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComp
                        mode="single"
                        selected={editingTask?.dueDate ? new Date(editingTask.dueDate) : undefined}
                        onSelect={(date) =>
                          setEditingTask(prev =>
                            prev ? { ...prev, dueDate: date ? date.toISOString() : null } : null
                          )
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={editingTask?.priority?.toString() || '2'}
                    onValueChange={(value) =>
                      setEditingTask(prev =>
                        prev ? { ...prev, priority: parseInt(value, 10) } : null
                      )
                    }
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
              </div>
              {editingTask && projects.find((p: any) => p.id === editingTask.projectId)?.members?.length > 0 && (
                <div className="space-y-2">
                  <Label>Assign to</Label>
                  <div className="flex flex-wrap gap-2">
                    {projects
                      .find((p: any) => p.id === editingTask.projectId)
                      ?.members.map((member: any) => (
                        <button
                          key={member.id}
                          type="button"
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full text-xs border",
                            editingTask.assigneeIds?.includes(member.id)
                              ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                              : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                          )}
                          onClick={() =>
                            setEditingTask(prev =>
                              prev
                                ? {
                                  ...prev,
                                  assigneeIds: prev.assigneeIds.includes(member.id)
                                    ? prev.assigneeIds.filter((id) => id !== member.id)
                                    : [...prev.assigneeIds, member.id],
                                }
                                : null
                            )
                          }
                        >
                          <span>{member.firstName}</span>
                          {editingTask.assigneeIds?.includes(member.id) && (
                            <X className="h-3 w-3" />
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingTask(null)}
                disabled={updateTaskMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTask}
                disabled={updateTaskMutation.isPending || !editingTask?.title.trim()}
              >
                {updateTaskMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
