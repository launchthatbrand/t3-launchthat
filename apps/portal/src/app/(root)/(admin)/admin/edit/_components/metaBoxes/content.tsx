/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { registerMetaBoxHook } from "@acme/admin-runtime";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";

import type { AdminMetaBoxContext, GeneralMetaBoxData } from "../types";
import { Editor } from "~/components/blocks/editor-x/editor";

const ContentMetaBox = ({ data }: { data: GeneralMetaBoxData }) => {
  const {
    editorKey,
    derivedEditorState,
    setContent,
    organizationId,
    excerpt,
    setExcerpt,
    headerLabel,
  } = data;

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

const registerContentMetaBox = () =>
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
      render: () => <ContentMetaBox data={data} />,
    };
  });

registerContentMetaBox();
