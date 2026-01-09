import { Copy, Loader2, PenSquare } from "lucide-react";

import { registerMetaBoxHook } from "@acme/admin-runtime";
import { Button } from "@acme/ui/button";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import type { AdminMetaBoxContext, AdminPostStatus } from "../types";

const ActionsMetaBox = ({ context }: { context: AdminMetaBoxContext }) => {
  const data = context.sidebar?.actions;
  if (!data) {
    return null;
  }
  const {
    renderSaveButton,
    handleDuplicate,
    isDuplicating,
    isSaving,
    canDuplicateRecord,
    puckEditorHref,
    isNewRecord,
    canSaveRecord,
    postStatus,
    setPostStatus,
    statusOptions,
  } = data;

  const activeStatus = statusOptions.find(
    (option) => option.value === postStatus,
  );

  const handleStatusChange = (value: string) => {
    setPostStatus(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="TEST space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-semibold uppercase">
              Status
            </p>
            <span className="text-muted-foreground text-xs font-medium">
              {activeStatus?.label ?? "Unknown"}
            </span>
          </div>
          <Label className="sr-only" htmlFor="post-status-select">
            Post status
          </Label>
          <Select value={postStatus} onValueChange={handleStatusChange}>
            <SelectTrigger id="post-status-select" className="w-full">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeStatus?.description ? (
            <p className="text-muted-foreground text-xs">
              {activeStatus.description}
            </p>
          ) : null}
        </div>
        {renderSaveButton({ fullWidth: true })}
        {!canSaveRecord ? (
          <p className="text-destructive text-xs">
            Saving is not available for this post type.
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Saved content is available across all tabs.
          </p>
        )}
      </div>
      <div className="space-y-2 rounded-md border p-3">
        <p className="text-muted-foreground text-xs font-semibold uppercase">
          Additional Actions
        </p>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={
              isDuplicating || isSaving || isNewRecord || !canDuplicateRecord
            }
            onClick={(event) => {
              event.stopPropagation();
              handleDuplicate(event);
            }}
          >
            {isDuplicating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Duplicating…
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Duplicate Entry
              </>
            )}
          </Button>
          <Button
            variant="outline"
            disabled={!puckEditorHref || isNewRecord}
            asChild={!!(puckEditorHref && !isNewRecord)}
            className="w-full gap-2"
          >
            {puckEditorHref && !isNewRecord ? (
              <a href={puckEditorHref} target="_blank" rel="noreferrer">
                <PenSquare className="h-4 w-4" />
                Edit with Puck
              </a>
            ) : (
              <>
                <PenSquare className="h-4 w-4" />
                Edit with Puck
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const registerActionsMetaBox: () => void = () => {
  registerMetaBoxHook<AdminMetaBoxContext>("sidebar", (context) => {
    if (
      context.visibility?.showSidebarActions === false ||
      !context.sidebar?.actions
    ) {
      return null;
    }

    return {
      id: "core-actions",
      title: "Actions",
      description: "Save, duplicate, or preview this entry.",
      location: "sidebar",
      priority: 0,
      render: () => <ActionsMetaBox context={context} />,
    };
  });
};
