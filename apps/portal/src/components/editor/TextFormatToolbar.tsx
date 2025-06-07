import { useEditorStore } from "@/src/store";
import {
  Bold,
  Code,
  Italic,
  Link,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from "lucide-react";

import { Separator } from "@acme/ui/separator";
import { Toggle } from "@acme/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/tooltip";

export function TextFormatToolbar() {
  // Use text formatting state from the store
  const textFormatting = useEditorStore((state) => state.textFormatting);

  // Get the action from the store
  const { toggleFormat } = useEditorStore();

  return (
    <div className="flex items-center space-x-1 rounded-md border p-1 shadow-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              aria-label="Toggle bold"
              pressed={textFormatting.isBold}
              onPressedChange={() => toggleFormat("isBold")}
            >
              <Bold className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              aria-label="Toggle italic"
              pressed={textFormatting.isItalic}
              onPressedChange={() => toggleFormat("isItalic")}
            >
              <Italic className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              aria-label="Toggle underline"
              pressed={textFormatting.isUnderline}
              onPressedChange={() => toggleFormat("isUnderline")}
            >
              <Underline className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Underline</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              aria-label="Toggle strikethrough"
              pressed={textFormatting.isStrikethrough}
              onPressedChange={() => toggleFormat("isStrikethrough")}
            >
              <Strikethrough className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Strikethrough</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-8" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              aria-label="Toggle superscript"
              pressed={textFormatting.isSuperscript}
              onPressedChange={() => toggleFormat("isSuperscript")}
            >
              <Superscript className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Superscript</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              aria-label="Toggle subscript"
              pressed={textFormatting.isSubscript}
              onPressedChange={() => toggleFormat("isSubscript")}
            >
              <Subscript className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Subscript</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-8" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              aria-label="Toggle code"
              pressed={textFormatting.isCode}
              onPressedChange={() => toggleFormat("isCode")}
            >
              <Code className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Code</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              aria-label="Toggle link"
              pressed={textFormatting.isLink}
              onPressedChange={() => toggleFormat("isLink")}
            >
              <Link className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Link</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
