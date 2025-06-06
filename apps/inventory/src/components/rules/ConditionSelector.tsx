import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type { ConditionConfig, ConditionDefinition } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { Button } from "@acme/ui/button";
import { ConfigForm } from "./ConfigForm";
import { Label } from "@acme/ui/label";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface ConditionSelectorProps {
  availableConditions: ConditionDefinition[];
  conditions: ConditionConfig[];
  onConditionsChange: (conditions: ConditionConfig[]) => void;
}

export function ConditionSelector({
  availableConditions,
  conditions,
  onConditionsChange,
}: ConditionSelectorProps) {
  const [newConditionType, setNewConditionType] = useState<string>("");

  const handleAddCondition = () => {
    if (!newConditionType) return;

    const newCondition: ConditionConfig = {
      type: newConditionType,
      config: {},
    };

    onConditionsChange([...conditions, newCondition]);
    setNewConditionType("");
  };

  const handleRemoveCondition = (index: number) => {
    const updatedConditions = [...conditions];
    updatedConditions.splice(index, 1);
    onConditionsChange(updatedConditions);
  };

  const handleConditionConfigChange = (
    index: number,
    config: Record<string, unknown>,
  ) => {
    const updatedConditions = [...conditions];
    if (updatedConditions[index]) {
      updatedConditions[index] = {
        type: updatedConditions[index].type,
        config,
      };
      onConditionsChange(updatedConditions);
    }
  };

  const getConditionDefinition = (type: string) => {
    return availableConditions.find((condition) => condition.type === type);
  };

  return (
    <div className="mb-6 space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-medium">Conditions</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Define conditions that must be met for this rule to execute.
        </p>
      </div>

      {conditions.length > 0 && (
        <div className="space-y-4">
          {conditions.map((condition, index) => {
            const conditionDef = getConditionDefinition(condition.type);

            return (
              <Card key={`condition-${index}`} className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => handleRemoveCondition(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {conditionDef?.name ?? condition.type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {conditionDef && (
                    <ConfigForm
                      schema={conditionDef.configSchema}
                      value={condition.config}
                      onChange={(config) =>
                        handleConditionConfigChange(index, config)
                      }
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Label htmlFor="condition-type">Add Condition</Label>
          <Select value={newConditionType} onValueChange={setNewConditionType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a condition" />
            </SelectTrigger>
            <SelectContent>
              {availableConditions.map((condition) => (
                <SelectItem key={condition.type} value={condition.type}>
                  {condition.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddCondition} disabled={!newConditionType}>
          Add Condition
        </Button>
      </div>
    </div>
  );
}
