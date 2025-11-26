"use client";

import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { SerializedEditorState } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";

import { cn } from "@acme/ui";

import { ContentEditable } from "../../editor/editor-ui/content-editable";
import { editorTheme } from "../../editor/themes/editor-theme";
import { nodes } from "./nodes";

export function EditorViewer({
  editorSerializedState,
  className,
}: {
  editorSerializedState?: SerializedEditorState | object;
  className?: string;
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
    <div className={cn("overflow-hidden bg-background", className)}>
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
