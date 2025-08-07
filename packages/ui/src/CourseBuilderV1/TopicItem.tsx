import React from "react";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";

import { Badge } from "@acme/ui/components/badge";
import { Button } from "@acme/ui/components/button";
import { Card, CardContent } from "@acme/ui/components/card";

import { classNames } from "../../../lib/utils";
import { EditableTitle } from "./EditableTitle";

interface TopicItemProps {
  title: string;
  status: string;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onTitleChange?: (newTitle: string) => void;
  quizCount?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
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

export const TopicItem: React.FC<TopicItemProps> = ({
  title,
  status,
  isDragging = false,
  dragHandleProps,
  onTitleChange,
  quizCount = 0,
  isExpanded,
  onToggleExpand,
}) => {
  const statusVariant = getStatusVariant(status);

  const handleTitleSave = (newTitle: string) => {
    if (onTitleChange) {
      onTitleChange(newTitle);
    }
  };

  return (
    <Card
      className={classNames(
        "mb-1 ml-8 border-l-4 transition-all",
        isDragging ? "border-l-primary/60 bg-primary/5 opacity-80" : "",
        isExpanded
          ? "border-l-primary shadow-sm"
          : "border-l-transparent hover:border-l-muted-foreground/30 hover:bg-secondary/10",
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

        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-medium text-white">
          T
        </div>

        <div className="flex-1">
          <div className="flex items-center">
            {onTitleChange ? (
              <EditableTitle
                title={title}
                onSave={handleTitleSave}
                placeholder="Enter topic title..."
              />
            ) : (
              <div className="line-clamp-1 font-medium">{title}</div>
            )}

            {quizCount > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({quizCount})
              </span>
            )}
          </div>
          <div className="mt-1">
            <Badge variant={statusVariant} className="text-xs capitalize">
              {status.toLowerCase()}
            </Badge>
          </div>
        </div>

        {onToggleExpand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse topic" : "Expand topic"}
            className="ml-auto h-7 w-7 p-0"
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
