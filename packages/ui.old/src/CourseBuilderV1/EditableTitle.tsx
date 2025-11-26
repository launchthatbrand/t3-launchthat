import React, { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { cn } from "@acme/ui";
import { Input } from "@acme/ui/input";

interface EditableTitleProps {
  title: string;
  onSave: (newTitle: string) => void;
  className?: string;
  placeholder?: string;
}

export const EditableTitle: React.FC<EditableTitleProps> = ({
  title,
  onSave,
  className = "",
  placeholder = "Enter title...",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    if (value.trim() !== title.trim() && value.trim() !== "") {
      onSave(value);
    } else if (value.trim() === "") {
      setValue(title); // Reset to original if empty
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (value.trim() !== "" && value.trim() !== title.trim()) {
        onSave(value);
      } else if (value.trim() === "") {
        setValue(title); // Reset to original if empty
      }
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setValue(title); // Reset to original
      setIsEditing(false);
    }
  };

  return (
    <div className={cn("group relative", className)}>
      {isEditing ? (
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full font-medium"
          autoFocus
        />
      ) : (
        <div
          onClick={handleStartEdit}
          className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-secondary/50"
        >
          <span className="line-clamp-1 font-medium">{title}</span>
          <Pencil
            size={14}
            className="ml-1 opacity-0 transition-opacity group-hover:opacity-70"
          />
        </div>
      )}
    </div>
  );
};
