import type { SerializedEditorState } from "lexical";

const hasRootNode = (value: unknown): value is { root: unknown } =>
  Boolean(value) && typeof value === "object" && "root" in (value!);

export const parseLexicalSerializedState = (
  value: string | null | undefined,
): SerializedEditorState | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    return hasRootNode(parsed) ? (parsed as SerializedEditorState) : null;
  } catch {
    return null;
  }
};

export const isLexicalSerializedStateString = (
  value: string | null | undefined,
): value is string => parseLexicalSerializedState(value) !== null;

export const createLexicalStateFromPlainText = (
  text: string,
): SerializedEditorState =>
  ({
    root: {
      children: [
        {
          children:
            text.length > 0
              ? [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text,
                    type: "text",
                    version: 1,
                  },
                ]
              : [],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
    version: 1,
  }) as unknown as SerializedEditorState;
