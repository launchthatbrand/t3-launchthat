"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { Images } from "lucide-react";
import { MediaPickerDialog } from "../../media-picker/MediaPickerDialog";
import { SelectItem } from "@acme/ui/select";
import { useToolbarContext } from "~/components/editor/context/toolbar-context";

interface InsertMediaProps {
  organizationId?: Id<"organizations">;
}

export function InsertMedia({ organizationId }: InsertMediaProps) {
  const { activeEditor, showModal } = useToolbarContext();

  if (!organizationId) {
    return null;
  }

  return (
    <SelectItem
      value="media-picker"
      onPointerUp={() => {
        showModal(
          "Insert Media",
          (onClose) => (
            <MediaPickerDialog
              activeEditor={activeEditor}
              onClose={onClose}
              organizationId={organizationId}
            />
          ),
          { contentClassName: "sm:min-w-[90vw] sm:min-h-[90vh]" },
        );
      }}
    >
      <div className="flex items-center gap-1">
        <Images className="size-4" />
        <span>Media</span>
      </div>
    </SelectItem>
  );
}
