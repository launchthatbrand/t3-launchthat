"use client";

import "@measured/puck/puck.css";

import type { Data } from "@measured/puck";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Puck } from "@measured/puck";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { useGroupData } from "~/hooks/useGroupData";
import useEditorStore from "~/store/useEditorStore";
import { createConfig } from "./config/puck-config";

interface PuckEditorProps {
  children: React.ReactNode;
}

/**
 * PuckEditor wraps the entire application and conditionally renders either:
 * 1. The Puck editor when ?editor=true is in the URL
 * 2. The normal children when not in editor mode
 */
export function PuckEditor({ children }: PuckEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditorMode = useEditorStore((state) => state.isEditorMode);
  const [initialData, setInitialData] = useState<Data>({
    content: [],
    root: {},
  });
  const [isSaving, setIsSaving] = useState(false);

  // Get group data for dropdown options
  const { groupOptions, currentGroupId, isLoading } = useGroupData();

  // Mutations for saving group page data
  const saveGroupPage = useMutation(api.groups.mutations.saveGroupPageData);

  // Create Puck configuration with dynamic options
  const config = createConfig({
    groupOptions,
    currentGroupId,
  });

  // Handle publishing/saving editor content
  const handlePublish = async (data: Data) => {
    if (!currentGroupId) {
      toast.error("No group selected. Cannot save page.");
      return;
    }

    try {
      setIsSaving(true);

      // Save data to Convex
      await saveGroupPage({
        groupId: currentGroupId,
        data: JSON.stringify(data),
        pageType: "dashboard", // You can add pageType to searchParams to make this dynamic
      });

      toast.success("Page saved successfully!");

      // Redirect to the group page (remove editor mode)
      const url = `/groups/${currentGroupId}`;
      router.push(url);
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error("Failed to save page. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // If not in editor mode, render children normally
  if (!isEditorMode) {
    return <>{children}</>;
  }

  // If loading group data, show loading indicator
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl">Loading editor...</div>
      </div>
    );
  }

  // Render Puck editor
  return (
    <div className="h-screen w-full">
      <Puck config={config} data={initialData} onPublish={handlePublish} />
    </div>
  );
}

/**
 * PuckContent renders a Puck page from saved data
 * Use this component to display saved Puck pages
 */
export function PuckContent({ data }: { data: Data }) {
  // Get group data for dynamic content
  const { groupOptions, currentGroupId } = useGroupData();

  // Create config with dynamic options
  const config = createConfig({
    groupOptions,
    currentGroupId,
  });

  return (
    <div className="puck-content">
      <Puck.Render config={config} data={data} />
    </div>
  );
}
