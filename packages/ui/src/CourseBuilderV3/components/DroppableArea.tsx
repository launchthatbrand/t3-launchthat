import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface DroppableAreaProps {
  id: string;
  type: string;
  className?: string;
  children: React.ReactNode;
}

const DroppableArea: React.FC<DroppableAreaProps> = ({
  id,
  type,
  className,
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type },
  });

  return (
    <div
      ref={setNodeRef}
      className={
        `${className ?? ""} " transition-colors duration-150` +
        (isOver ? " bg-primary/5 ring-2 ring-primary/60" : "")
      }
      data-droppable-type={type}
    >
      {children}
    </div>
  );
};

export default DroppableArea;
