"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { type Data } from "@measured/puck";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";

import { PuckEditorWithGroups } from "./PuckEditorWithGroups";

interface GroupPageEditorProps {
  groupId?: string;
  initialData?: Data;
  pageId?: string; // Optional existing page ID for editing
  onSaveSuccess?: () => void;
}

export function GroupPageEditor({
  groupId,
  initialData = { content: [], root: {} },
  pageId,
  onSaveSuccess,
}: GroupPageEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Mutations for saving pages
  const createPage = useMutation(api.groups.mutations.createGroupPage);
  const updatePage = useMutation(api.groups.mutations.updateGroupPage);

  const handlePublish = async (data: Data) => {
    if (!groupId) {
      toast.error("No group selected. Cannot save page.");
      return;
    }

    setIsSaving(true);

    try {
      if (pageId) {
        // Update existing page
        await updatePage({
          pageId,
          data: JSON.stringify(data),
        });
        toast.success("Page updated successfully");
      } else {
        // Create new page
        const newPageId = await createPage({
          groupId,
          title: "New Group Page",
          data: JSON.stringify(data),
        });

        toast.success("Page created successfully");

        // If it's a new page, redirect to the edit URL with the new ID
        router.push(`/groups/${groupId}/pages/${newPageId}/edit`);
      }

      // Call the success callback if provided
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      toast.error("Failed to save page");
      console.error("Error saving page:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (pageId) {
      // For existing pages, go back to the view mode
      router.push(`/groups/${groupId}/pages/${pageId}`);
    } else {
      // For new pages, go back to the group dashboard
      router.push(`/groups/${groupId}`);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-background p-4">
        <h1 className="text-xl font-semibold">
          {pageId ? "Edit Group Page" : "Create Group Page"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={() => handlePublish(initialData)}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Page"}
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <PuckEditorWithGroups
          initialData={initialData}
          onPublish={handlePublish}
        />
      </div>
    </div>
  );
}
