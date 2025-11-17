"use client";

import { JSX, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement } from "@lexical/utils";
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from "lexical";

import { Button } from "@acme/ui/button";
import { Textarea } from "@acme/ui/textarea";

import {
  $createMermaidNode,
  MermaidNode,
} from "~/components/editor/nodes/mermaid-node";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export const INSERT_MERMAID_COMMAND: LexicalCommand<void> = createCommand(
  "INSERT_MERMAID_COMMAND",
);

export function MermaidPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState(
    "flowchart LR\n  App --> Repo\n  Repo --> ORM\n  ORM -->|Migrations| DB[(Database)]",
  );

  useEffect(() => {
    if (!editor.hasNodes([MermaidNode])) {
      throw new Error("MermaidPlugin: MermaidNode not registered on editor");
    }

    return editor.registerCommand(
      INSERT_MERMAID_COMMAND,
      () => {
        setIsOpen(true);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  const onInsert = () => {
    editor.update(() => {
      const node = $createMermaidNode(code);
      $insertNodes([node]);
      if ($isRootOrShadowRoot(node.getParentOrThrow())) {
        $wrapNodeInElement(node, $createParagraphNode).selectEnd();
      }
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Insert Mermaid Diagram</DialogTitle>
        </DialogHeader>
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={8}
          className="font-mono"
        />
        <DialogFooter>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onInsert}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
