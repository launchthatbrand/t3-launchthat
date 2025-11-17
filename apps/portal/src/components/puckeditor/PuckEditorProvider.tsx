"use client";

import "@measured/puck/puck.css";

import type { Id } from "@/convex/_generated/dataModel";
import type { Data } from "@measured/puck";
import React, { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Puck } from "@measured/puck";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { useGroupData } from "~/hooks/useGroupData";
import useEditorStore from "~/store/useEditorStore";
import { getPageIdentifier } from "~/utils/pageIdentifier";
import { createConfig } from "./config/puck-config";
import { getTemplateById } from "./templates/groupTemplates";
import { TemplateDialog } from "./templates/TemplateDialog";

interface PuckEditorProps {
  children: React.ReactNode;
}

/**
 * Custom header component that includes a template button
 */
function CustomHeader({
  onPublish,
  showTemplateButton = true,
  onSelectTemplate,
}: {
  onPublish: () => void;
  showTemplateButton?: boolean;
  onSelectTemplate: (templateId: string) => void;
}) {
  return (
    <div className="flex h-16 items-center justify-between border-b bg-white px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Page Editor</h1>
        {showTemplateButton && (
          <TemplateDialog onSelectTemplate={onSelectTemplate} />
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onPublish}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          Publish
        </button>
      </div>
    </div>
  );
}

/**
 * PuckEditor wraps the entire application and conditionally renders either:
 * 1. The Puck editor when ?editor=true is in the URL
 * 2. The normal children when not in editor mode
 */
function PuckEditorInner({ children }: PuckEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditorMode = useEditorStore((state) => state.isEditorMode);
  const [editorData, setEditorData] = useState<Data>({
    content: [],
    root: {},
  });
  const [editorKey, setEditorKey] = useState(0); // Add a key to force re-render

  // Get group data for dropdown options
  const { groupOptions, currentGroupId, isLoading } = useGroupData();

  // Explicitly get group ID from URL if missing from context
  const groupIdFromUrl = searchParams.get("groupId");

  // Set the effective group ID, with fallback to URL parameter
  const effectiveGroupId = currentGroupId ?? groupIdFromUrl;

  // Get the current URL path using Next.js hook
  const pathname = usePathname();

  // Use the centralized page identifier utility
  const pageIdentifier = getPageIdentifier(pathname, effectiveGroupId);

  // console.log("[PuckEditor] Page identifier:", pageIdentifier);

  // Fetch existing dashboard data if available from the new table
  const existingData = useQuery(
    api.puckEditor.queries.getData,
    pageIdentifier ? { pageIdentifier } : "skip",
  );
  // console.log("[PuckEditor] Existing data:", existingData);

  // Load existing data when available
  useEffect(() => {
    if (existingData && typeof existingData === "string") {
      try {
        const parsedData = JSON.parse(existingData) as Data;
        setEditorData(parsedData);
      } catch (e) {
        console.error("Failed to parse existing dashboard data:", e);
      }
    }
  }, [existingData]);

  // Mutations for saving Puck page data
  const savePuckPage = useMutation(api.puckEditor.mutations.updateData);

  // Create Puck configuration with dynamic options
  const config = createConfig({
    groupOptions,
    currentGroupId: effectiveGroupId
      ? (effectiveGroupId as Id<"groups">)
      : undefined,
  });

  // Handle publishing/saving editor content
  const handlePublish = async (data: Data) => {
    if (!pageIdentifier) {
      toast.error(
        "No page identifier found. Cannot save page. Please ensure you're on a valid page.",
      );
      return;
    }

    try {
      console.log("[PuckEditor] Saving data for page:", pageIdentifier);

      const safeData: Data = {
        content: [...data.content],
        root: { ...data.root },
      };
      console.log("[PuckEditor] Safe data:", safeData);

      // Save data to Convex using the new mutation
      await savePuckPage({
        pageIdentifier,
        data: JSON.stringify(safeData),
      });

      // Show success message but don't redirect
      toast.success("Page saved successfully!");
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error(
        `Failed to save page: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (!template) {
      toast.error("Template not found");
      return;
    }

    if (!effectiveGroupId) {
      toast.error("No group ID available");
      return;
    }

    // Apply the template with the current group ID
    try {
      const templateData = template.data(effectiveGroupId as Id<"groups">);
      setEditorData(templateData);
      setEditorKey((prev) => prev + 1); // Force re-render of the Puck editor
      toast.success(`Template "${template.name}" applied successfully!`);
    } catch (error) {
      console.error("Error applying template:", error);
      toast.error("Failed to apply template");
    }
  };

  // If not in editor mode, render children normally
  if (!isEditorMode) {
    return <>{children}</>;
  }

  // If no group ID available, show an error message
  if (!effectiveGroupId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="text-xl text-red-600">Error: No group ID found</div>
        <p className="text-gray-600">
          Please ensure you're editing a specific group page.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  // If loading group data, show loading indicator
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl">Loading editor...</div>
      </div>
    );
  }

  // Render Puck editor with custom header
  return (
    <div className="h-screen w-full">
      <Puck
        key={editorKey} // Force re-render when template changes
        config={config}
        data={editorData}
        onChange={setEditorData}
        onPublish={handlePublish}
        renderHeader={() => (
          <CustomHeader
            onPublish={() => handlePublish(editorData)}
            onSelectTemplate={handleSelectTemplate}
          />
        )}
      />
    </div>
  );
}

export function PuckEditor({ children }: PuckEditorProps) {
  return (
    <Suspense fallback={children}>
      <PuckEditorInner>{children}</PuckEditorInner>
    </Suspense>
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
    currentGroupId: currentGroupId ?? undefined,
  });

  return (
    <div className="puck-content">
      {/* Display the Puck content in read-only mode */}
      <Puck
        config={config}
        data={data}
        // The readOnly prop is not directly supported
        renderHeader={undefined}
      />
    </div>
  );
}
