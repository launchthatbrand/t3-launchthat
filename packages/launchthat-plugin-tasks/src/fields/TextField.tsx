import React, { useEffect, useRef, useState } from "react";

export interface TextFieldProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  value,
  onSave,
  className,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleBlur = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setEditing(false);
      if (draft !== value) onSave(draft);
    } else if (e.key === "Escape") {
      setEditing(false);
      setDraft(value);
    }
  };

  return editing ? (
    <input
      ref={inputRef}
      className={className + "w-auto rounded border px-1 py-0.5"}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-label="Edit text"
    />
  ) : (
    <span
      className={className + " cursor-pointer"}
      onClick={() => setEditing(true)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") setEditing(true);
      }}
      role="button"
      aria-label="Edit text"
    >
      {value}
    </span>
  );
};
