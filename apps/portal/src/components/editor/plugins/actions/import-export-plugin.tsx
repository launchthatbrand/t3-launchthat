"use client";

import type { LexicalEditor, LexicalNode } from "lexical";
import { CodeNode } from "@lexical/code";
import { exportFile, importFile } from "@lexical/file";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $isElementNode } from "lexical";
import { DownloadIcon, FileDown, FileText, UploadIcon } from "lucide-react";

import { $createMermaidNode } from "~/components/editor/nodes/mermaid-node";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

function replaceMermaidCodeBlocks() {
  const root = $getRoot();
  const walk = (node: LexicalNode) => {
    if (node.getType() === "code" && node instanceof CodeNode) {
      const lang = node.getLanguage() as string | null;
      if ((lang ?? "").toLowerCase() === "mermaid") {
        const codeText = node.getTextContent();
        const mermaid = $createMermaidNode(codeText);
        node.replace(mermaid);
        return;
      }
    }
    if ($isElementNode(node)) {
      for (const child of node.getChildren()) walk(child);
    }
  };
  walk(root);
}

function importMarkdown(editor: LexicalEditor) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".md,.markdown,text/markdown";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    editor.update(() => {
      // Convert markdown to Lexical
      $convertFromMarkdownString(text, TRANSFORMERS);
      // Convert fenced mermaid blocks to MermaidNode
      replaceMermaidCodeBlocks();
    });
  };
  input.click();
}

function exportMarkdown(editor: LexicalEditor) {
  let md = "";
  editor.update(() => {
    md = $convertToMarkdownString(TRANSFORMERS);
  });
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `post-${new Date().toISOString()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportExportPlugin() {
  const [editor] = useLexicalComposerContext();
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={"ghost"}
            onClick={() => importFile(editor)}
            title="Import JSON"
            aria-label="Import editor state from JSON"
            size={"sm"}
            className="p-2"
          >
            <UploadIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Import JSON</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={"ghost"}
            onClick={() =>
              exportFile(editor, {
                fileName: `post-${new Date().toISOString()}`,
                source: "editor",
              })
            }
            title="Export JSON"
            aria-label="Export editor state to JSON"
            size={"sm"}
            className="p-2"
          >
            <DownloadIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export JSON</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={"ghost"}
            onClick={() => importMarkdown(editor)}
            title="Import Markdown"
            aria-label="Import Markdown"
            size={"sm"}
            className="p-2"
          >
            <FileText className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Import Markdown</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={"ghost"}
            onClick={() => exportMarkdown(editor)}
            title="Export Markdown"
            aria-label="Export Markdown"
            size={"sm"}
            className="p-2"
          >
            <FileDown className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export Markdown</TooltipContent>
      </Tooltip>
    </>
  );
}
