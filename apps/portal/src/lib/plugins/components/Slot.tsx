import type { PluginContext } from "../types";
import React from "react";
import { useSlotComponents } from "../hooks";

interface SlotProps {
  name: string;
  context?: PluginContext;
  fallback?: React.ReactNode;
  className?: string;
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

export const Slot: React.FC<SlotProps> = ({
  name,
  context = {},
  fallback = null,
  className,
  wrapper: Wrapper,
}) => {
  const components = useSlotComponents(name, context);

  if (components.length === 0) {
    return fallback as React.ReactElement;
  }

  const content = (
    <div className={className}>
      {components.map((Component, index) => (
        <Component key={`${name}-${index}`} {...context} />
      ))}
    </div>
  );

  if (Wrapper) {
    return <Wrapper>{content}</Wrapper>;
  }

  return content;
};

export default Slot;
