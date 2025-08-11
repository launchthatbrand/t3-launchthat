import { WorkflowIcon } from "lucide-react";

import { INSERT_MERMAID_COMMAND } from "~/components/editor/plugins/mermaid-plugin";
import { ComponentPickerOption } from "~/components/editor/plugins/picker/component-picker-option";

export function MermaidPickerPlugin() {
  return new ComponentPickerOption("Mermaid Diagram", {
    icon: <WorkflowIcon className="size-4" />,
    keywords: ["mermaid", "diagram", "flowchart", "chart"],
    onSelect: (_, editor) =>
      editor.dispatchCommand(INSERT_MERMAID_COMMAND, undefined),
  });
}
