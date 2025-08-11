"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axiosInstance";
import { useState, useMemo } from "react";
import { Loader2, CheckCircle, Clock, AlertCircle, Check, X, AlertTriangle, ChevronLeft, MoreVertical, Plus, Trash2, Pencil, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, isPast, isThisWeek, isThisMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { DragEndEvent, DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { SortableItem } from './SortableItem';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate: string;
  assignees: Array<{ id: string; firstName?: string; email: string; avatar?: string }>;
  labels?: string[];
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
};

const TaskCard = ({ task, onTaskClick, onStatusChange }: SortableTaskProps) => {
  const status = statusOptions.find(s => s.value === task.status) || statusOptions[0];
  const [isHovered, setIsHovered] = useState(false);
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch comments for the task
  const { data: comments = [], isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: ['task-comments', task.id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/post/tasks/${task.id}/comments`);
      return data || [];
    },
  });

  // Add comment mutation
  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await apiClient.post('/post/comments', {
        content,
        taskId: task.id,
      });
      return data;
    },
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
      toast.success('Comment added successfully');
    },
    onError: () => {
      toast.error('Failed to add comment');
    }
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      addComment.mutate(comment.trim());
    }
  };

  // Format date to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (isToday(date)) return format(date, 'h:mm a');
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div
      onClick={() => onTaskClick(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700",
        "hover:shadow-md transition-all duration-200 cursor-pointer",
        "hover:ring-2 hover:ring-offset-2 hover:ring-blue-500/20",
        "dark:shadow-gray-900/10 dark:hover:shadow-gray-900/20"
      )}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <Badge
          variant="outline"
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-full",
            status.color,
            status.bgColor
          )}
        >
          {status.label}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Task Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 pr-8">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {task.description}
            </p>
          )}
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-2" />
            <span>{getDueDateLabel(task.dueDate)}</span>
            {isPast(new Date(task.dueDate)) && task.status !== 'DONE' && (
              <span className="ml-2 text-red-500 text-xs font-medium">
                Overdue
              </span>
            )}
          </div>
        )}

        {/* Assignees */}
        {task.assignees.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Assigned to:
            </div>
            <div className="flex flex-wrap gap-2">
              {task.assignees.map((assignee) => (
                <div
                  key={assignee.id}
                  className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-xs"
                >
                  <span className="text-gray-700 dark:text-gray-200">
                    {assignee.firstName || assignee.email.split('@')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Comments ({comments.length})
            </h4>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
            >
              {showComments ? 'Hide' : 'Show'}
              <ChevronDown className={`h-4 w-4 transition-transform ${showComments ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showComments && (
            <div className="mt-3 space-y-4">
              {/* Comment List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 -mr-2">
                {isLoadingComments ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="group relative bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium text-sm">
                          {comment.user.firstName?.[0]?.toUpperCase() || comment.user.email[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {comment.user.firstName || comment.user.email.split('@')[0]}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelativeTime(comment.createdAt)}
                              {comment.createdAt !== comment.updatedAt && ' (edited)'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No comments yet. Be the first to comment!
                    </p>
                  </div>
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mt-3">
                <div className="relative">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="block w-full px-4 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-24"
                    onClick={(e) => e.stopPropagation()}
                    disabled={addComment.isPending}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!comment.trim() || addComment.isPending}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 text-sm"
                  >
                    {addComment.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : 'Comment'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function UserTaskList({ projectId, projectName, onBack }: { projectId: string; projectName?: string; onBack?: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch tasks for the current project and user
  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['user-project-tasks', user?.id, projectId],
    queryFn: async () => {
      if (!user?.id || !projectId) return [];
      const response = await apiClient.get(`/post/projects/${projectId}/my-tasks`);
      return response.data.data || [];
    },
    enabled: !!user?.id && !!projectId,
    refetchOnWindowFocus: false,
  });

  // Update task status mutation
  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiClient.patch(`/post/tasks/${taskId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Task updated');
      refetch();
    },
    onError: () => {
      toast.error('Failed to update task');
    }
  });

  // Handle drag and drop with @dnd-kit
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Find the status columns involved in the drag
    const activeStatus = Object.keys(tasksByStatus).find(status =>
      tasksByStatus[status].some(task => task.id === active.id)
    );
    const overStatus = Object.keys(tasksByStatus).find(status =>
      tasksByStatus[status].some(task => task.id === over.id)
    );

    if (activeStatus && overStatus) {
      // If dragged to a different column, update the status
      if (activeStatus !== overStatus) {
        updateTaskStatus.mutate({
          taskId: active.id as string,
          status: overStatus
        });
      }
    }
  };

  // Set up sensors for different input methods
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = { 'TODO': [], 'IN_PROGRESS': [], 'REVIEW': [], 'DONE': [] };
    tasks.forEach(task => {
      if (!grouped[task.status]) grouped[task.status] = [];
      grouped[task.status].push(task);
    });
    return grouped;
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20">
        <div className="flex items-center text-red-700 dark:text-red-300">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>Failed to load tasks. Please try again.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {projectName || 'My Tasks'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Task Board */}
      <div className="flex-1 overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
            {statusOptions.map((status) => (
              <div key={status.value} className="flex flex-col h-full">
                <div className={`flex items-center justify-between p-3 rounded-t-lg ${status.bgColor} dark:bg-opacity-10`}>
                  <div className="flex items-center">
                    <status.icon className={`h-4 w-4 mr-2 ${status.color}`} />
                    <span className="text-sm font-medium">{status.label}</span>
                    <span className="ml-2 text-xs bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {tasksByStatus[status.value]?.length || 0}
                    </span>
                  </div>
                </div>
                <div
                  className={`flex-1 p-2 space-y-3 min-h-[100px] rounded-b-lg border border-t-0 ${status.bgColor} dark:bg-opacity-5`}
                >
                  <SortableContext
                    items={tasksByStatus[status.value] || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {tasksByStatus[status.value]?.map((task) => (
                      <SortableItem key={task.id} id={task.id}>
                        <TaskCard
                          task={task}
                          onTaskClick={setSelectedTask}
                          onStatusChange={(taskId, newStatus) =>
                            updateTaskStatus.mutate({ taskId, status: newStatus })
                          }
                        />
                      </SortableItem>
                    ))}
                  </SortableContext>
                </div>
              </div>
            ))}
          </div>
        </DndContext>
      </div>

      {/* Task Detail Modal */}
      {isDetailOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedTask.title}
                </h3>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => {
                          updateTaskStatus.mutate({
                            taskId: selectedTask.id,
                            status: status.value
                          });
                          setIsDetailOpen(false);
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${selectedTask.status === status.value
                          ? `${status.color} dark:bg-opacity-20`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTask.dueDate && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Due Date
                    </h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(selectedTask.dueDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}

                {selectedTask.assignees && selectedTask.assignees.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Assigned To
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedTask.assignees.map((assignee) => (
                        <div
                          key={assignee.id}
                          className="flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                        >
                          <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                          {assignee.firstName || assignee.email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
