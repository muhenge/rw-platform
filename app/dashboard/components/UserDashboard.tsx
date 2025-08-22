"use client";

import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Loader2, MessageSquare, X, FileText } from "lucide-react";

// Helper function to capitalize the first letter of each word
const capitalize = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper to format status text
const formatStatus = (status: string) => {
  return status.toLowerCase().split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};
import UserTaskList from "./UserTaskList";
import { DescriptionModal } from "@/components/ui/description-modal";

type Project = {
  id: string;
  name: string;
  description?: string;
  tasks?: Array<{
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
    dueDate?: string;
    assignees: Array<{ id: string; firstName?: string; email: string }>;
    comments?: Array<{
      id: string;
      content: string;
      user: {
        id: string;
        firstName: string | null;
        email: string;
      };
      createdAt: string;
    }>;
  }>;
};

type Comment = {
  id: string;
  content: string;
  user: {
    id: string;
    firstName: string | null;
    email: string;
  };
  createdAt: string;
};

export default function UserDashboard() {
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [showTaskDetails, setShowTaskDetails] = useState(true);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['user-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const { data } = await apiClient.get(`/post/users/${user.id}/projects?include=tasks&include=comments`);
        console.log('Fetched projects:', data);

        // Sort projects by creation date (newest first)
        const projectsData = Array.isArray(data) ? data : data?.data || [];
        const sortedProjects = [...projectsData].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Select the first project by default if none is selected
        if (sortedProjects.length > 0 && !selectedProject) {
          setSelectedProject(sortedProjects[0]);
        }
        return sortedProjects;
      } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
      }
    },
    onSuccess: (projectsData) => {
      console.log('Projects loaded:', projectsData);

      if (!projectsData || projectsData.length === 0) {
        console.log('No projects available');
        return;
      }

      try {
        // Create a deep copy to avoid mutating the original data
        const sortedProjects = JSON.parse(JSON.stringify(projectsData));

        // Sort projects by updatedAt (newest first)
        sortedProjects.sort((a: Project, b: Project) =>
          new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        );

        const latestProject = sortedProjects[0];
        console.log('Latest project selected:', latestProject);

        // First, set the selected project
        setSelectedProject(latestProject);

        // Then, in the next render cycle, handle the task selection
        setTimeout(() => {
          if (latestProject.tasks?.length > 0) {
            const sortedTasks = [...latestProject.tasks].sort((a, b) =>
              new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
            );
            const latestTask = sortedTasks[0];
            console.log('Latest task selected:', latestTask);

            // Set the selected task and show details
            setSelectedTask(latestTask);
            setShowTaskDetails(true);
          } else {
            console.log('No tasks available in the latest project');
            setSelectedTask(null);
            setShowTaskDetails(false);
          }
        }, 0);
      } catch (error) {
        console.error('Error processing projects data:', error);
      }
    },
    refetchOnWindowFocus: false,
    enabled: !!user?.id,
  });

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !selectedTask?.id) return;

    try {
      await apiClient.post('/post/comments', {
        content: comment.trim(),
        taskId: selectedTask.id,
      });
      setComment('');
      setSelectedTask({ ...selectedTask });
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };


  const handleTaskSelect = (task: any) => {
    console.log('Task selected in UserDashboard:', {
      taskId: task.id,
      hasComments: !!task.comments,
      commentCount: task.comments?.length || 0
    }

  );

    setSelectedTask(prev => {
      const updatedTask = {
        ...task,
        // Preserve existing comments if the task is the same and has comments
        comments: task.comments || (prev?.id === task.id ? prev.comments : [])
      };
      console.log('Updated task with comments:', updatedTask);
      return updatedTask;
    });
    setShowTaskDetails(true);
  };

  useEffect(() => {
    console.log('Selected task updated:', {
      taskId: selectedTask?.id,
      hasComments: !!selectedTask?.comments,
      commentCount: selectedTask?.comments?.length || 0
    });
  }, [selectedTask]);

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative">
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">My Projects</h2>
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`p-3 rounded-md cursor-pointer transition-colors ${selectedProject?.id === project.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{project.name ? project.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : ''}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingProject(project);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    title="View description"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {project._count?.tasks || 0} tasks
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedProject?.name ? selectedProject.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 'Dashboard'}
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Left side - Task List */}
            <div className={`${showTaskDetails ? 'w-1/2' : 'w-full'} border-r border-gray-200 dark:border-gray-700 overflow-y-auto`}>
              {isLoading ? (
                <div className="p-6">Loading projects and tasks...</div>
              ) : projects.length > 0 ? (
                <UserTaskList
                  projectId={selectedProject?.id || ''}
                  onTaskSelect={handleTaskSelect}
                  selectedTaskId={selectedTask?.id}
                  key={selectedProject?.id} // Add key to force re-render when project changes
                />
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No projects found. You don't have access to any projects yet.
                </div>
              )}
            </div>

            {/* Right side - Task Details & Comments */}
            {selectedTask && showTaskDetails && (
              <div className="w-1/2 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold">{selectedTask.title ? selectedTask.title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : ''}</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTaskDetails(false)}
                      className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Task status */}
                  <div className="mb-6">
                    <span className="text-xs px-2 py-1 rounded-full">{selectedTask.status ? selectedTask.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : ''}</span>
                    <Badge variant="outline" className="capitalize">
                      {formatStatus(selectedTask.status)}
                    </Badge>
                  </div>

                  {/* Comments Section */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Comments</h4>
                    <div className="space-y-4">
                      <form onSubmit={handleAddComment} className="space-y-2">
                        <Textarea
                          placeholder="Add a comment..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button type="submit" size="sm">
                            Comment
                          </Button>
                        </div>
                      </form>

                      <div className="space-y-4 mt-4">
                        {selectedTask.comments && selectedTask.comments.length > 0 ? (
                          selectedTask.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              {/* <Avatar className="h-8 w-8 mt-1">
                                <AvatarFallback>
                                  {comment.user?.firstName?.[0] || comment.user?.email?.[0]}
                                </AvatarFallback>
                              </Avatar> */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {comment.user?.firstName || comment.user?.email.split('@')[0]}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                                  </span>
                                </div>
                                <p className="text-sm mt-1">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No comments yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <DescriptionModal
        isOpen={!!viewingProject}
        onClose={() => setViewingProject(null)}
        title={viewingProject?.name || 'Project Description'}
        description={viewingProject?.description || ''}
      />
    </div>
  );
}
