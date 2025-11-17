import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
} from "lucide-react";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useState } from "react";

import { Button } from "@acme/ui/button";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { Toggle } from "@acme/ui/toggle";

export interface RichTextEditorProps {
  content?: string;
  placeholder?: string;
  maxLength?: number;
  onChange?: (html: string) => void;
  onMention?: (query: string) => void;
  onHashtag?: (query: string) => void;
  maxHeight?: string;
  autofocus?: boolean;
}

// Create a function to generate unique Mention extensions
const createMentionExtension = (options: {
  name: string;
  char?: string;
  class: string;
  items: (query: { query: string }) => { id: string; label: string }[];
}) => {
  return Mention.configure({
    HTMLAttributes: {
      class: options.class,
    },
    suggestion: {
      char: options.char ?? "@",
      items: options.items,
      render: () => {
        return {
          onStart: () => {
            // This would be implemented in a real scenario
          },
          onUpdate: () => {
            // This would be implemented in a real scenario
          },
          onKeyDown: () => {
            // This would be implemented in a real scenario
            return false;
          },
          onExit: () => {
            // This would be implemented in a real scenario
          },
        };
      },
    },
  }).extend({ name: options.name });
};

// User mention extension
const UserMention = createMentionExtension({
  name: "userMention",
  class: "mention",
  items: ({ query }) => {
    return [
      { id: "user1", label: "John Doe" },
      { id: "user2", label: "Jane Smith" },
      { id: "user3", label: "Alex Johnson" },
    ].filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  },
});

// Hashtag extension
const HashtagMention = createMentionExtension({
  name: "hashtagMention",
  char: "#",
  class: "hashtag",
  items: ({ query }) => {
    return [
      { id: "tag1", label: "trending" },
      { id: "tag2", label: "popular" },
      { id: "tag3", label: "tech" },
      { id: "tag4", label: "community" },
    ].filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  },
});

export function RichTextEditor({
  content = "",
  placeholder = "Write something...",
  maxLength = 5000,
  onChange,
  onMention: _onMention,
  onHashtag: _onHashtag,
  maxHeight = "300px",
  autofocus = false,
}: RichTextEditorProps) {
  const [characterCount, setCharacterCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      UserMention,
      HashtagMention,
    ],
    content,
    autofocus,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const characterCount = editor.storage.characterCount as
        | { characters?: () => number }
        | undefined;
      const count = characterCount?.characters?.() ?? 0;
      setCharacterCount(count);
      if (onChange) {
        onChange(html);
      }
    },
    onCreate: ({ editor }) => {
      const characterCount = editor.storage.characterCount as
        | { characters?: () => number }
        | undefined;
      const count = characterCount?.characters?.() ?? 0;
      setCharacterCount(count);
    },
  });

  // Handle link insertion
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previousUrl ?? "");

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor w-full">
      <div className="flex flex-wrap gap-1 border-b p-1">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          aria-label="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <Button variant="ghost" size="sm" onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="ml-auto flex items-center text-xs text-muted-foreground">
          <span
            className={characterCount > maxLength ? "text-destructive" : ""}
          >
            {characterCount}/{maxLength}
          </span>
        </div>
      </div>

      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100 }}
        shouldShow={({ editor: _editor, state: _state }) => {
          // Show the bubble menu when text is selected
          return editor.view.state.selection.content().size > 0;
        }}
      >
        <div className="flex items-center gap-1 rounded-md border border-border bg-background px-1 py-1 shadow-md">
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold className="h-3 w-3" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic className="h-3 w-3" />
          </Toggle>

          <Button
            variant="ghost"
            size="sm"
            onClick={setLink}
            className="h-7 w-7 p-0"
          >
            <LinkIcon className="h-3 w-3" />
          </Button>
        </div>
      </BubbleMenu>

      <div
        className="prose-sm prose dark:prose-invert w-full overflow-y-auto px-3 py-2"
        style={{ maxHeight }}
      >
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 100px;
        }

        .ProseMirror p {
          margin: 0.5em 0;
        }

        .mention {
          color: #5e81ac;
          font-weight: 500;
          background-color: rgba(94, 129, 172, 0.1);
          border-radius: 4px;
          padding: 0 2px;
        }

        .hashtag {
          color: #88c0d0;
          font-weight: 500;
          background-color: rgba(136, 192, 208, 0.1);
          border-radius: 4px;
          padding: 0 2px;
        }
      `}</style>
    </div>
  );
}
