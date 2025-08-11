"use client";

import { useState } from 'react';
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
import { Loader2, MessageSquare, X } from "lucide-react";
import UserTaskList from "./UserTaskList";

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
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [comment, setComment] = useState('');

  // Fetch user's projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['user-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await apiClient.get(`/post/users/${user.id}/projects`);
      // The endpoint returns { data: Project[], meta: { count: number } }
      return data?.data || [];
    },
    onSuccess: (data) => {
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    },
    enabled: !!user?.id,
  });


  console.log(projects)
  // Handle comment submission
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !selectedTask?.id) return;

    try {
      await apiClient.post('/post/comments', {
        content: comment.trim(),
        taskId: selectedTask.id,
      });
      setComment('');
      // Refresh task details
      setSelectedTask({ ...selectedTask });
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white dark:bg-gray-800 p-4">
        <h2 className="text-lg font-semibold mb-4">My Projects</h2>
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`p-3 rounded-lg cursor-pointer ${selectedProject?.id === project.id
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                onClick={() => setSelectedProject(project)}
              >
                <h3 className="font-medium">{project.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {project.description || 'No description'}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedProject && (
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex">
              {/* Task Board */}
              <div className={`${selectedTask ? 'w-2/3' : 'w-full'} p-4`}>
                <UserTaskList
                  projectId={selectedProject.id}
                  onTaskSelect={setSelectedTask}
                />
              </div>

              {/* Task Details Panel */}
              {selectedTask && (
                <div className="w-1/3 border-l bg-white dark:bg-gray-800 h-full flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Task Details</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTask(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm text-gray-500 mb-1">Title</h4>
                        <p className="font-medium">{selectedTask.title}</p>
                      </div>

                      <div>
                        <h4 className="text-sm text-gray-500 mb-1">Status</h4>
                        <Badge variant="outline" className="capitalize">
                          {selectedTask.status?.toLowerCase().replace('_', ' ')}
                        </Badge>
                      </div>

                      {/* Comments Section */}
                      <div className="mt-6">
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
                            {selectedTask.comments?.map((comment: any) => (
                              <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8 mt-1">
                                  <AvatarFallback>
                                    {comment.user?.firstName?.[0] || comment.user?.email?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {comment.user?.firstName || comment.user?.email?.split('@')[0]}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                  <p className="text-sm mt-1">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
