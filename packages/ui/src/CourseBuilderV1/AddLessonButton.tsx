import React from "react";
import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";

interface AddLessonButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const AddLessonButton: React.FC<AddLessonButtonProps> = ({
  onClick,
  disabled = false,
  className = "",
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 justify-start px-2 text-sm font-normal text-muted-foreground hover:text-primary ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <Plus size={14} className="mr-1" />
      <span>New Lesson</span>
    </Button>
  );
};

export default AddLessonButton;
