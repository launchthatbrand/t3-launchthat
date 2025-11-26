import React from "react";

import { cn } from "@acme/ui"; // Assuming shared cn utility

interface ItemWrapperProps {
  /** Content to render in the main area (e.g., toggle, title) */
  children: React.ReactNode;
  /** Slot for rendering action buttons (e.g., Add, Remove) */
  actions?: React.ReactNode;
  /** Slot for rendering the drag handle */
  dragHandle?: React.ReactNode;
  /** Additional class names for the root element */
  className?: string;
  /** Optional: Apply styling for drag overlay state */
  isOverlay?: boolean;
  // Add other state-based props as needed (e.g., isSelected, isDraggingOver)
}

export const ItemWrapper: React.FC<ItemWrapperProps> = ({
  children,
  actions,
  dragHandle,
  className,
  isOverlay = false,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md border bg-card p-3 text-card-foreground shadow-sm transition-shadow",
        // Apply overlay styles conditionally
        isOverlay ? "ring-2 ring-blue-500 ring-offset-2" : "hover:shadow-md",
        // Apply any custom classes passed in
        className,
      )}
      // Add style prop if needed for dynamic styles like transforms during drag
    >
      {/* Optional Drag Handle Slot */}
      {dragHandle && <div className="mr-2 flex-shrink-0">{dragHandle}</div>}

      {/* Main Content Slot - takes up remaining space */}
      <div className="min-w-0 flex-grow">
        {" "}
        {/* min-w-0 prevents content overflow issues */}
        {children}
      </div>

      {/* Optional Actions Slot */}
      {actions && (
        <div className="ml-2 flex flex-shrink-0 items-center space-x-1">
          {actions}
        </div>
      )}
    </div>
  );
};
