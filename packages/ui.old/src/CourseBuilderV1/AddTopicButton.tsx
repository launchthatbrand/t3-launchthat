import React from "react";
import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";

interface AddTopicButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const AddTopicButton: React.FC<AddTopicButtonProps> = ({
  onClick,
  disabled = false,
  className = "",
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`ml-8 h-8 justify-start px-2 text-sm font-normal text-muted-foreground hover:text-primary ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <Plus size={14} className="mr-1" />
      <span>New Topic</span>
    </Button>
  );
};
