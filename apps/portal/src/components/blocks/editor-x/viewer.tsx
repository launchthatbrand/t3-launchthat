"use client";

import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { SerializedEditorState } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";

import { ContentEditable } from "~/components/editor/editor-ui/content-editable";
import { editorTheme } from "~/components/editor/themes/editor-theme";
import { nodes } from "./nodes";

export function EditorViewer({
  editorSerializedState,
}: {
  editorSerializedState?: SerializedEditorState | object;
}) {
  const initialConfig: InitialConfigType = {
    namespace: "EditorViewer",
    theme: editorTheme,
    nodes,
    editable: false,
    onError: (e) => console.error(e),
    ...(editorSerializedState
      ? { editorState: JSON.stringify(editorSerializedState) }
      : {}),
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              placeholder=""
              className="ContentEditable__root prose max-w-none p-4"
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </LexicalComposer>
    </div>
  );
}
