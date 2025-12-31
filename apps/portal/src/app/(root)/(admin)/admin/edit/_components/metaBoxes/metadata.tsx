import { formatDistanceToNow } from "date-fns";

import type { RegisteredMetaBox } from "@acme/admin-runtime";
import { registerMetaBoxHook } from "@acme/admin-runtime";
import type { AdminMetaBoxContext } from "../types";

const MetadataMetaBox = ({ context }: { context: AdminMetaBoxContext }) => {
  const data = context.sidebar?.metadata!;
  const { headerLabel, post, isNewRecord } = data;

  return (
    <div className="text-muted-foreground space-y-3 text-sm">
      <div>
        <p className="text-foreground font-medium">Post Type</p>
        <p>{headerLabel}</p>
      </div>
      {!isNewRecord && post ? (
        <>
          <div>
            <p className="text-foreground font-medium">Status</p>
            <p className="capitalize">{post.status ?? "draft"}</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Updated</p>
            <p>
              {post.updatedAt
                ? formatDistanceToNow(post.updatedAt, { addSuffix: true })
                : "Not updated"}
            </p>
          </div>
        </>
      ) : (
        <p>This entry has not been saved yet.</p>
      )}
    </div>
  );
};

export const registerMetadataMetaBox: () => void = () => {
  registerMetaBoxHook<AdminMetaBoxContext>(
    "sidebar",
    (context): RegisteredMetaBox<AdminMetaBoxContext> | null => {
      if (
        context.visibility?.showSidebarMetadata === false ||
        !context.sidebar?.metadata
      ) {
        return null;
      }

      return {
        id: "core-metadata",
        title: "Metadata",
        description: "High-level attributes for this entry.",
        location: "sidebar",
        priority: 10,
        render: () => <MetadataMetaBox context={context} />,
      };
    },
  );
};
