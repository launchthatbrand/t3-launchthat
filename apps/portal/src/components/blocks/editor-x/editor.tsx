"use client";

import type { Id } from "@/convex/_generated/dataModel";
import type {
  InitialConfigType} from "@lexical/react/LexicalComposer";
import {
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import type { EditorState, SerializedEditorState } from "lexical";

import { TooltipProvider } from "@acme/ui/tooltip";

import { FloatingLinkContext } from "~/components/editor/context/floating-link-context";
import { SharedAutocompleteContext } from "~/components/editor/context/shared-autocomplete-context";
import { editorTheme } from "~/components/editor/themes/editor-theme";
import { nodes } from "./nodes";
import { Plugins } from "./plugins";

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error);
  },
};

type RegisterMetaPayloadCollector = (
  collector: () => Record<string, unknown> | null | undefined,
) => () => void;

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  organizationId,
  postTypeSlug,
  attachmentsContext,
  registerMetaPayloadCollectorAction,
  initialAutoThumbnailUrl,
}: {
  editorState?: EditorState;
  editorSerializedState?: SerializedEditorState;
  onChange?: (editorState: EditorState) => void;
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void;
  organizationId?: Id<"organizations">;
  postTypeSlug?: string | null;
  attachmentsContext?: {
    attachments: {
      mediaItemId: Id<"mediaItems">;
      url: string;
      title?: string;
      alt?: string;
      mimeType?: string;
      width?: number;
      height?: number;
    }[];
    setAttachments: (
      updater: (
        prev: {
          mediaItemId: Id<"mediaItems">;
          url: string;
          title?: string;
          alt?: string;
          mimeType?: string;
          width?: number;
          height?: number;
        }[],
      ) => {
        mediaItemId: Id<"mediaItems">;
        url: string;
        title?: string;
        alt?: string;
        mimeType?: string;
        width?: number;
        height?: number;
      }[],
    ) => void;
  };
  registerMetaPayloadCollectorAction?: RegisterMetaPayloadCollector;
  initialAutoThumbnailUrl?: string;
}) {
  return (
    <div className="bg-background overflow-hidden rounded-lg border shadow">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          ...(editorState ? { editorState } : {}),
          ...(editorSerializedState
            ? { editorState: JSON.stringify(editorSerializedState) }
            : {}),
        }}
      >
        <TooltipProvider>
          <SharedAutocompleteContext>
            <FloatingLinkContext>
              <Plugins
                organizationId={organizationId}
                postTypeSlug={postTypeSlug}
                attachmentsContext={attachmentsContext}
                registerMetaPayloadCollectorAction={registerMetaPayloadCollectorAction}
                initialAutoThumbnailUrl={initialAutoThumbnailUrl}
              />

              <OnChangePlugin
                ignoreSelectionChange={true}
                onChange={(editorState) => {
                  onChange?.(editorState);
                  onSerializedChange?.(editorState.toJSON());
                }}
              />
            </FloatingLinkContext>
          </SharedAutocompleteContext>
        </TooltipProvider>
      </LexicalComposer>
    </div>
  );
}
