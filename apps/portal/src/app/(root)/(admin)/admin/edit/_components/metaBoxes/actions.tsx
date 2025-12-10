import { Copy, Loader2, PenSquare } from "lucide-react";

import { Button } from "@acme/ui/button";

import type { RegisteredMetaBox } from "@acme/admin-runtime";
import { registerMetaBoxHook } from "@acme/admin-runtime";
import type { AdminMetaBoxContext } from "../types";

const ActionsMetaBox = ({ context }: { context: AdminMetaBoxContext }) => {
  const data = context.sidebar?.actions!;

  return (
    <div className="space-y-3">
      {data.renderSaveButton({ fullWidth: true })}
      <Button
        variant="outline"
        className="w-full gap-2"
        disabled={
          data.isDuplicating ||
          data.isSaving ||
          data.isNewRecord ||
          !data.supportsPostsTable
        }
        onClick={(event) => {
          event.stopPropagation();
          data.handleDuplicate(event);
        }}
      >
        {data.isDuplicating ? (
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
        disabled={!data.puckEditorHref || data.isNewRecord}
        asChild={!!(data.puckEditorHref && !data.isNewRecord)}
        className="w-full gap-2"
      >
        {data.puckEditorHref && !data.isNewRecord ? (
          <a href={data.puckEditorHref!} target="_blank" rel="noreferrer">
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
      {!data.supportsPostsTable ? (
        <p className="text-muted-foreground text-xs">
          Saving is not available for this post type.
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">
          Saved content is available across all tabs.
        </p>
      )}
    </div>
  );
};

const registerActionsMetaBox = () =>
  registerMetaBoxHook<AdminMetaBoxContext>(
    "sidebar",
    (context): RegisteredMetaBox<AdminMetaBoxContext> | null => {
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
    },
  );

registerActionsMetaBox();
