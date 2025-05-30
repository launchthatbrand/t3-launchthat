import React from "react";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";

import { Badge } from "@acme/ui/components/badge";
import { Button } from "@acme/ui/components/button";
import { Card, CardContent } from "@acme/ui/components/card";

import { classNames } from "../../../lib/utils";
import { EditableTitle } from "./EditableTitle";

type LessonItemProps = {
  title: string;
  status: string;
  isExpanded?: boolean;
  onToggleExpand?: (e: React.MouseEvent) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onTitleChange?: (newTitle: string) => void;
  id?: string;
  topicCount?: number;
};

export const LessonItem: React.FC<LessonItemProps> = ({
  title,
  status,
  isExpanded,
  onToggleExpand,
  isDragging = false,
  dragHandleProps,
  onTitleChange,
  id,
  topicCount = 0,
}) => {
  // Map status to appropriate variant
  const getStatusVariant = (status: string) => {
    const lowercaseStatus = status.toLowerCase();
    if (lowercaseStatus === "published" || lowercaseStatus === "active")
      return "default";
    if (lowercaseStatus === "draft") return "secondary";
    return "outline";
  };

  const handleTitleSave = (newTitle: string) => {
    if (onTitleChange) {
      onTitleChange(newTitle);
    }
  };

  return (
    <Card
      className={classNames(
        "mb-1 border-l-4 transition-all",
        isDragging ? "border-l-primary/60 bg-primary/5 opacity-80" : "",
        isExpanded
          ? "border-l-primary shadow-sm"
          : "border-l-transparent hover:border-l-muted-foreground/30 hover:bg-secondary/10",
      )}
    >
      <CardContent className="flex items-center gap-2 p-3">
        {dragHandleProps ? (
          <div
            className="cursor-grab p-1 text-muted-foreground"
            {...dragHandleProps}
          >
            <GripVertical size={16} />
          </div>
        ) : (
          <div className="cursor-grab p-1 text-muted-foreground">
            <GripVertical size={16} />
          </div>
        )}

        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
          L
        </div>

        <div className="flex-1">
          <div className="flex items-center">
            {onTitleChange ? (
              <EditableTitle
                title={title}
                onSave={handleTitleSave}
                placeholder="Enter lesson title..."
              />
            ) : (
              <div className="line-clamp-1 font-medium">{title}</div>
            )}

            {topicCount > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({topicCount})
              </span>
            )}
          </div>
          <div className="mt-1">
            <Badge variant={getStatusVariant(status)} className="text-xs">
              {status}
            </Badge>
          </div>
        </div>

        {onToggleExpand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse lesson" : "Expand lesson"}
            className="ml-auto h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
