"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { createContext, ReactNode, useContext } from "react";

import { useCurrentGroupId, useGroupOptions } from "./utils/group-helpers";

interface GroupContextType {
  currentGroupId: Id<"groups"> | undefined;
  groupOptions: Array<{ label: string; value: string }>;
  isLoading: boolean;
}

// Create context with default values
const GroupContext = createContext<GroupContextType>({
  currentGroupId: undefined,
  groupOptions: [],
  isLoading: true,
});

// Hook for components to consume the context
export const useGroupContext = () => useContext(GroupContext);

interface PuckGroupProviderProps {
  children: ReactNode;
}

export function PuckGroupProvider({ children }: PuckGroupProviderProps) {
  const { options, currentGroupId, isLoading } = useGroupOptions();

  return (
    <GroupContext.Provider
      value={{
        currentGroupId,
        groupOptions: options,
        isLoading,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}
