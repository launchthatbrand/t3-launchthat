 
 
 
 
import { registerMetaBoxHook } from "@acme/admin-runtime";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";

import type { AdminMetaBoxContext, GeneralMetaBoxData } from "../types";
import { Editor } from "~/components/blocks/editor-x/editor";

const ContentMetaBox = ({
  data,
  context,
}: {
  data: GeneralMetaBoxData;
  context: AdminMetaBoxContext;
}) => {
  const {
    editorKey,
    derivedEditorState,
    setContent,
    organizationId,
    excerpt,
    setExcerpt,
    headerLabel,
  } = data;

  const initialAutoThumbnailUrl =
    typeof context.customFields?.postMetaMap.lmsAutoThumbnailSourceUrl ===
    "string"
      ? (context.customFields.postMetaMap.lmsAutoThumbnailSourceUrl)
      : undefined;

  return (
    <>
      <div className="space-y-2">
        <Label>{headerLabel} Content</Label>
        <Editor
          key={editorKey}
          editorSerializedState={derivedEditorState}
          onSerializedChange={(state) => {
            setContent(JSON.stringify(state));
          }}
          organizationId={organizationId}
          postTypeSlug={context.slug}
          attachmentsContext={context.attachmentsContext ?? undefined}
          registerMetaPayloadCollectorAction={context.registerMetaPayloadCollector}
          initialAutoThumbnailUrl={initialAutoThumbnailUrl}
          debugLabel={`admin:${String(context.slug)}:${String(context.postId ?? "")}`}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="post-excerpt">Excerpt</Label>
        <Textarea
          id="post-excerpt"
          rows={3}
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          placeholder="Short summary for listing views"
        />
      </div>
    </>
  );
};

export const registerContentMetaBox: () => void = () => {
  registerMetaBoxHook<AdminMetaBoxContext>("main", (context) => {
    const data = context.general;
    if (context.visibility?.showGeneralPanel === false || !data) {
      return null;
    }

    return {
      id: "core-content",
      title: "Content",
      description: `Compose the body and summary for this ${data.headerLabel} entry.`,
      location: "main",
      priority: 10,
      render: () => <ContentMetaBox data={data} context={context} />,
    };
  });
};
