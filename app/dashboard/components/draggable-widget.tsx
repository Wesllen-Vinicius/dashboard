"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { IconGripVertical } from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
  isEditing: boolean;
}

export function DraggableWidget({ id, children, isEditing }: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <motion.div
        ref={setNodeRef}
        style={style}
        className="h-full"
        animate={{ scale: isDragging ? 1.05 : 1 }}
    >
      <Card className={cn(
        "relative h-full transition-all duration-300",
        isEditing && "border-primary/50 border-2 shadow-lg",
        isDragging && "shadow-2xl"
      )}>
        <div
            {...attributes}
            {...listeners}
            className={cn(
                "absolute top-2 right-2 p-2 cursor-grab rounded-full transition-all duration-300",
                isEditing ? "opacity-70 hover:bg-accent" : "opacity-0"
            )}
            aria-label="Arrastar widget"
        >
            <IconGripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        {children}
      </Card>
    </motion.div>
  );
}
