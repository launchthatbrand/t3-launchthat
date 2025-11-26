import React from "react";
import { GripVertical } from "lucide-react";

import { Badge } from "@acme/ui/components/badge";
import { Card, CardContent } from "@acme/ui/components/card";

import { classNames } from "../../../lib/utils";
import { EditableTitle } from "./EditableTitle";

interface QuizItemProps {
  title: string;
  status: string;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onTitleChange?: (newTitle: string) => void;
  parentType?: "lesson" | "topic" | "course";
}

// Helper function to get appropriate badge variant based on status
const getStatusVariant = (
  status: string,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case "published":
      return "default";
    case "draft":
      return "secondary";
    case "archived":
      return "destructive";
    default:
      return "outline";
  }
};

export const QuizItem: React.FC<QuizItemProps> = ({
  title,
  status,
  isDragging = false,
  dragHandleProps,
  onTitleChange,
  parentType = "course",
}) => {
  const statusVariant = getStatusVariant(status);

  const handleTitleSave = (newTitle: string) => {
    if (onTitleChange) {
      onTitleChange(newTitle);
    }
  };

  // Calculate margin based on parent type
  const marginClass =
    parentType === "topic" ? "ml-12" : parentType === "lesson" ? "ml-8" : "";

  return (
    <Card
      className={classNames(
        "mb-1 border-l-4 transition-all",
        marginClass,
        isDragging ? "border-l-primary/60 bg-primary/5 opacity-80" : "",
        "border-l-transparent hover:border-l-muted-foreground/30 hover:bg-secondary/10",
      )}
    >
      <CardContent className="flex items-center gap-2 p-2">
        {dragHandleProps ? (
          <div
            className="cursor-move p-1 text-muted-foreground"
            {...dragHandleProps}
          >
            <GripVertical size={14} />
          </div>
        ) : (
          <div className="cursor-move p-1 text-muted-foreground">
            <GripVertical size={14} />
          </div>
        )}

        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-xs font-medium text-white">
          Q
        </div>

        <div className="flex-1">
          <div className="flex items-center">
            {onTitleChange ? (
              <EditableTitle
                title={title}
                onSave={handleTitleSave}
                placeholder="Enter quiz title..."
              />
            ) : (
              <div className="line-clamp-1 font-medium">{title}</div>
            )}
          </div>
          <div className="mt-1">
            <Badge variant={statusVariant} className="text-xs capitalize">
              {status.toLowerCase()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
