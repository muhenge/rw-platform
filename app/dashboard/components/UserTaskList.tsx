"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axiosInstance";
import { useState, useMemo } from "react";
import { Loader2, CheckCircle, Clock, AlertCircle, Check, X, AlertTriangle, ChevronLeft, MoreVertical, Plus, Trash2, Pencil, ChevronDown, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, isPast, isThisWeek, isThisMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate: string;
  assignees: Array<{ id: string; firstName?: string; email: string; avatar?: string }>;
  labels?: string[];
  comments?: any[];
};

type Comment = {
  id: string;
  content: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
};

const statusOptions = [
  { value: 'TODO', label: 'To Do', icon: Clock, color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-50' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: AlertCircle, color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-50' },
  { value: 'REVIEW', label: 'In Review', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-50' },
  { value: 'DONE', label: 'Done', icon: CheckCircle, color: 'bg-green-100 text-green-800', bgColor: 'bg-green-50' },
];

const getStatusColor = (status: string) => {
  const statusOption = statusOptions.find(opt => opt.value === status);
  return statusOption?.color || 'bg-gray-100';
};

const getDueDateLabel = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);

  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isPast(date)) return `Overdue: ${format(date, 'MMM d')}`;
  if (isThisWeek(date)) return `This ${format(date, 'EEEE')}`;
  if (isThisMonth(date)) return format(date, 'MMM d');
  return format(date, 'MMM d, yyyy');
};

type SortableTaskProps = {
  task: Task;
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: string) => void;
  isSelected: boolean;
};

const TaskCard = ({
  task,
  onStatusChange,
  onTaskSelect,
  isSelected
}: {
  task: Task;
  onStatusChange: (taskId: string, status: string) => void;
  onTaskSelect: (task: Task) => void;
  isSelected: boolean;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const statusColors = {
    TODO: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    REVIEW: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    DONE: 'bg-green-100 text-green-800 hover:bg-green-200',
  };

  const handleStatusClick = async (newStatus: string) => {
    if (task.status === newStatus) return;

    try {
      setIsUpdating(true);
      await onStatusChange(task.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
      onClick={() => onTaskSelect(task)}
    >
      {/* Status Bar */}
      <div className="px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          {Object.entries(statusColors).map(([status, className]) => (
            <button
              key={status}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusClick(status);
              }}
              disabled={isUpdating}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${status === task.status ? 'ring-2 ring-offset-1 ring-blue-500' : 'opacity-70 hover:opacity-100'} ${className}`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            {task.dueDate && (
              <p className="text-xs text-muted-foreground mt-2">
                Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Comment button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTaskSelect(task);
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Assignees */}
        {task.assignees?.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-2">
              {task.assignees.map((assignee) => (
                <Avatar
                  key={assignee.id}
                  className="h-8 w-8 border-2 border-white dark:border-gray-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskSelect(task);
                  }}
                >
                  <AvatarFallback>
                    {assignee.firstName?.[0] || assignee.email[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {task.comments?.length > 0 && (
              <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{task.comments.length}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function UserTaskList({ projectId, onTaskSelect }: { projectId: string; onTaskSelect: (task: Task) => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Handle task selection
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    onTaskSelect(task);
  };

  // Fetch tasks for the project
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/post/projects/${projectId}/my-tasks`);
      return data.data || [];
    },
    enabled: !!projectId && !!user?.id,
  });

  // Fetch comments for the selected task
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['task-comments', selectedTask?.id],
    queryFn: async () => {
      if (!selectedTask) return [];
      const { data } = await apiClient.get(`/post/tasks/${selectedTask.id}/comments`);
      return data || [];
    },
    enabled: !!selectedTask?.id,
  });

  // Update task status
  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { data } = await apiClient.patch(`/post/tasks/${taskId}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast.success('Task status updated');
    },
    onError: () => {
      toast.error('Failed to update task status');
    },
  });

  // Handle adding a new comment
  const addComment = async (content: string) => {
    if (!selectedTask || !user?.id) return;

    try {
      await apiClient.post('/post/comments', {
        taskId: selectedTask.id,
        content,
      });
      await refetchComments();
      toast.success('Comment added');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleStatusChange = (taskId: string, status: string) => {
    updateTaskStatus.mutate({ taskId, status });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <CheckCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks yet</h3>
        <p className="text-sm text-gray-500">Get started by creating a new task</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={handleStatusChange}
          onTaskSelect={handleTaskClick}
          isSelected={selectedTask?.id === task.id}
        />
      ))}
    </div>
  );
}
