"use client";

import { WorkflowIcon as FlowIcon } from "lucide-react";

import { useToolbarContext } from "~/components/editor/context/toolbar-context";
import { INSERT_MERMAID_COMMAND } from "~/components/editor/plugins/mermaid-plugin";
import { SelectItem } from "@acme/ui/select";

export function InsertMermaid() {
  const { activeEditor } = useToolbarContext();
  return (
    <SelectItem
      value="mermaid"
      onPointerUp={() =>
        activeEditor.dispatchCommand(INSERT_MERMAID_COMMAND, undefined)
      }
    >
      <div className="flex items-center gap-1">
        <FlowIcon className="size-4" />
        <span>Mermaid Diagram</span>
      </div>
    </SelectItem>
  );
}
