"use client";

import type { Id } from "@/convex/_generated/dataModel";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { EditorState, SerializedEditorState } from "lexical";
import { useEffect, useMemo, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";

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
  autoFocus = false,
  debugLabel,
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
  autoFocus?: boolean;
  debugLabel?: string;
}) {
  // IMPORTANT:
  // - `editorSerializedState` is "initial content" for this editor instance.
  // - If we feed it into LexicalComposer on every render (or whenever the object identity changes),
  //   Lexical will reinitialize/reset, which makes typing appear "stuck" until save.
  // - We intentionally freeze the initial serialized state for the lifetime of this mount.
  // - When the parent wants to truly reset the editor, it should change the React `key`
  //   on <Editor /> (we do this on admin edit pages via `editorKey`).
  const initialSerializedRef = useRef<string | null>(null);
  if (initialSerializedRef.current === null) {
    initialSerializedRef.current = editorSerializedState
      ? JSON.stringify(editorSerializedState)
      : null;
  }

  // IMPORTANT: LexicalComposer's initialConfig should be stable across renders.
  // If it changes every render, Lexical may recreate the editor which can steal focus
  // and make typing impossible.
  const initialConfig = useMemo<InitialConfigType>(() => {
    return {
      ...editorConfig,
      ...(editorState ? { editorState } : {}),
      ...(!editorState && initialSerializedRef.current
        ? { editorState: initialSerializedRef.current }
        : {}),
    };
  }, [editorState]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!debugLabel) return;
    // eslint-disable-next-line no-console
    console.info(`[editor-x debug] mount ${debugLabel}`, {
      autoFocus,
      organizationId,
      postTypeSlug,
      hasSerialized: Boolean(initialSerializedRef.current),
      hasEditorState: Boolean(editorState),
    });
    return () => {
      // eslint-disable-next-line no-console
      console.info(`[editor-x debug] unmount ${debugLabel}`);
    };
  }, [autoFocus, debugLabel, editorState, organizationId, postTypeSlug]);

  return (
    <div className="bg-background overflow-hidden rounded-lg border shadow">
      <LexicalComposer initialConfig={initialConfig}>
        <TooltipProvider>
          <SharedAutocompleteContext>
            <FloatingLinkContext>
              <Plugins
                organizationId={organizationId}
                postTypeSlug={postTypeSlug}
                attachmentsContext={attachmentsContext}
                registerMetaPayloadCollectorAction={
                  registerMetaPayloadCollectorAction
                }
                initialAutoThumbnailUrl={initialAutoThumbnailUrl}
                autoFocus={autoFocus}
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
