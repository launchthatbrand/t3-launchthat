import React from "react";

interface DropZoneProps {
  message?: string;
  className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  message = "Drop Topics or Quizzes here",
  className = "",
}) => {
  return (
    <div
      className={`rounded-md border-2 border-dashed border-muted-foreground/20 p-4 text-center text-sm text-muted-foreground ${className}`}
    >
      {message}
    </div>
  );
};
