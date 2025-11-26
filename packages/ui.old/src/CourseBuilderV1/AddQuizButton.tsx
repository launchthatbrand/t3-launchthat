import React from "react";
import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";

interface AddQuizButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  parentType?: "lesson" | "topic" | "course";
}

export const AddQuizButton: React.FC<AddQuizButtonProps> = ({
  onClick,
  disabled = false,
  className = "",
  parentType = "course",
}) => {
  // Calculate margin based on parent type
  const marginClass =
    parentType === "topic" ? "ml-12" : parentType === "lesson" ? "ml-8" : "";

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 justify-start px-2 text-sm font-normal text-muted-foreground hover:text-primary ${marginClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <Plus size={14} className="mr-1" />
      <span>New Quiz</span>
    </Button>
  );
};
