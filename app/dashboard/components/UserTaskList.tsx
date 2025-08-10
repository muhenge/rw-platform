"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axiosInstance";
import { useState, useMemo } from "react";
import { Loader2, CheckCircle, Clock, AlertCircle, Check, X, AlertTriangle, ChevronLeft, MoreVertical, Plus, Trash2 } from "lucide-react";
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

  return (
    <div
      onClick={() => onTaskClick(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700",
        "hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing",
        "hover:ring-2 hover:ring-offset-2 hover:ring-blue-500/20",
        "dark:shadow-gray-900/10 dark:hover:shadow-gray-900/20"
      )}
    >
      {/* Status indicator dot */}
      <div className="absolute top-3 right-3">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full transition-all duration-200",
            {
              'bg-gray-400': status.value === 'TODO',
              'bg-blue-500': status.value === 'IN_PROGRESS',
              'bg-yellow-500': status.value === 'REVIEW',
              'bg-green-500': status.value === 'DONE',
            }
          )}
        />
      </div>

      <div className="pr-4">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 mb-2">
          {task.title}
        </h3>

        {task.dueDate && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
            <Clock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className={cn(
              "truncate",
              {
                'text-red-500 dark:text-red-400':
                  isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)),
                'text-amber-500 dark:text-amber-400':
                  isToday(new Date(task.dueDate)),
              }
            )}>
              {getDueDateLabel(task.dueDate)}
            </span>
          </div>
        )}

        {(task.assignees?.length > 0 || task.labels?.length > 0) && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {task.assignees?.length > 0 && (
              <div className="flex -space-x-1.5">
                {task.assignees.slice(0, 3).map((assignee) => (
                  <div
                    key={assignee.id}
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
                      "border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700",
                      "text-gray-600 dark:text-gray-300"
                    )}
                    title={assignee.firstName || assignee.email}
                  >
                    {assignee.firstName?.[0]?.toUpperCase() || assignee.email[0]?.toUpperCase()}
                  </div>
                ))}
                {task.assignees.length > 3 && (
                  <div className="h-6 px-1.5 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
            )}

            {task.labels?.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-auto">
                {task.labels.slice(0, 2).map((label, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 truncate max-w-[80px]"
                    title={label}
                  >
                    {label}
                  </span>
                ))}
                {task.labels.length > 2 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    +{task.labels.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick actions that appear on hover */}
        <div className={cn(
          "absolute right-2 top-2 flex items-center space-x-1 transition-opacity duration-150",
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {statusOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, opt.value);
                  }}
                  className="text-sm"
                >
                  <opt.icon className={`h-3.5 w-3.5 mr-2 ${opt.color}`} />
                  Mark as {opt.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm text-red-600 dark:text-red-400">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
