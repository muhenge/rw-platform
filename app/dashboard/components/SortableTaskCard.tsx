"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "./UserTaskList";
import { Clock, MessageSquare } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { cn } from "@/lib/utils";

interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
}

export function SortableTaskCard({ task, onClick }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform), // Changed from CSS.Transform.toString
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 'auto',
    position: 'relative', // Added for better z-index handling
  };
  const getDueDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return `Overdue: ${format(date, 'MMM d')}`;
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-card border rounded-lg p-4 shadow-sm cursor-grab active:cursor-grabbing",
        "hover:border-primary/50 transition-colors",
        isDragging && "shadow-lg ring-2 ring-primary/20"
      )}
    >
      <h3 className="font-medium text-sm mb-2">{task.title}</h3>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>{getDueDateLabel(task.dueDate)}</span>
        </div>

        {task.comments?.length > 0 && (
          <div className="flex items-center">
            <MessageSquare className="h-3 w-3 mr-1" />
            <span>{task.comments.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SortableTaskCard;
