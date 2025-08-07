import React from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";

import { Button } from "@acme/ui/components/button";

import { classNames } from "../../../lib/utils";

interface SectionHeadingProps {
  title: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  isExpanded = true,
  onToggleExpand,
  dragHandleProps,
}) => {
  return (
    <div
      className={classNames(
        "mb-2 flex items-center justify-between rounded-sm bg-secondary/40 p-2",
        isExpanded ? "" : "mb-0",
      )}
    >
      <div className="flex items-center gap-2">
        {dragHandleProps ? (
          <div
            className="cursor-grab p-1 text-muted-foreground"
            {...dragHandleProps}
          >
            <GripVertical size={16} />
          </div>
        ) : (
          <div className="p-1">
            <GripVertical size={16} className="invisible" />
          </div>
        )}
        <div className="text-sm font-medium uppercase tracking-wide text-foreground/80">
          {title}
        </div>
      </div>

      {onToggleExpand && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
          className="h-7 w-7 p-0"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </Button>
      )}
    </div>
  );
};
