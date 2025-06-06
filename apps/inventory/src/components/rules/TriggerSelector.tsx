import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { useEffect, useState } from "react";

import { ConfigForm } from "./ConfigForm";
import { Label } from "@acme/ui/label";
import type { TriggerDefinition } from "./types";

interface TriggerSelectorProps {
  availableTriggers: TriggerDefinition[];
  selectedType: string;
  config: Record<string, unknown>;
  onSelectTrigger: (type: string) => void;
  onConfigChange: (config: Record<string, unknown>) => void;
}

export function TriggerSelector({
  availableTriggers,
  selectedType,
  config,
  onSelectTrigger,
  onConfigChange,
}: TriggerSelectorProps) {
  const [selectedTrigger, setSelectedTrigger] = useState<
    TriggerDefinition | undefined
  >(availableTriggers.find((trigger) => trigger.type === selectedType));

  // Update selected trigger when props change
  useEffect(() => {
    const trigger = availableTriggers.find((t) => t.type === selectedType);
    setSelectedTrigger(trigger);
  }, [availableTriggers, selectedType]);

  const handleTriggerChange = (value: string) => {
    onSelectTrigger(value);
    const newTrigger = availableTriggers.find((t) => t.type === value);

    if (newTrigger) {
      setSelectedTrigger(newTrigger);
      // Reset config when trigger type changes
      onConfigChange({});
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <div>
        <Label htmlFor="trigger-type">Trigger Type</Label>
        <Select value={selectedType} onValueChange={handleTriggerChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a trigger" />
          </SelectTrigger>
          <SelectContent>
            {availableTriggers.map((trigger) => (
              <SelectItem key={trigger.type} value={trigger.type}>
                {trigger.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTrigger && (
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedTrigger.description}
          </p>
        )}
      </div>

      {selectedTrigger && (
        <ConfigForm
          schema={selectedTrigger.configSchema}
          value={config}
          onChange={onConfigChange}
          title="Trigger Configuration"
        />
      )}
    </div>
  );
}
