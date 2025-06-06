import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import type { ActionConfig, ActionDefinition } from "./types";
import { ConfigForm } from "./ConfigForm";

interface ActionSelectorProps {
  availableActions: ActionDefinition[];
  actions: ActionConfig[];
  onActionsChange: (actions: ActionConfig[]) => void;
}

export function ActionSelector({
  availableActions,
  actions,
  onActionsChange,
}: ActionSelectorProps) {
  const [newActionType, setNewActionType] = useState<string>("");

  const handleAddAction = () => {
    if (!newActionType) return;

    const newAction: ActionConfig = {
      type: newActionType,
      config: {},
    };

    onActionsChange([...actions, newAction]);
    setNewActionType("");
  };

  const handleRemoveAction = (index: number) => {
    const updatedActions = [...actions];
    updatedActions.splice(index, 1);
    onActionsChange(updatedActions);
  };

  const handleActionConfigChange = (
    index: number,
    config: Record<string, unknown>,
  ) => {
    const updatedActions = [...actions];
    if (updatedActions[index]) {
      updatedActions[index] = {
        type: updatedActions[index].type,
        config,
      };
      onActionsChange(updatedActions);
    }
  };

  const getActionDefinition = (type: string) => {
    return availableActions.find((action) => action.type === type);
  };

  return (
    <div className="mb-6 space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-medium">Actions</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Define actions to execute when this rule's conditions are met.
        </p>
      </div>

      {actions.length > 0 && (
        <div className="space-y-4">
          {actions.map((action, index) => {
            const actionDef = getActionDefinition(action.type);

            return (
              <Card key={`action-${index}`} className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => handleRemoveAction(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {actionDef?.name ?? action.type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {actionDef && (
                    <ConfigForm
                      schema={actionDef.configSchema}
                      value={action.config}
                      onChange={(config) =>
                        handleActionConfigChange(index, config)
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
          <Label htmlFor="action-type">Add Action</Label>
          <Select value={newActionType} onValueChange={setNewActionType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an action" />
            </SelectTrigger>
            <SelectContent>
              {availableActions.map((action) => (
                <SelectItem key={action.type} value={action.type}>
                  {action.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddAction} disabled={!newActionType}>
          Add Action
        </Button>
      </div>
    </div>
  );
}
