import { useEffect, useState } from "react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";

import { ActionSelector } from "./ActionSelector";
import { ConditionSelector } from "./ConditionSelector";
import { TriggerSelector } from "./TriggerSelector";
import {
  ActionDefinition,
  ConditionDefinition,
  Integration,
  Rule,
  RuleComponentsMap,
  TriggerDefinition,
} from "./types";

interface RuleFormProps {
  rule?: Partial<Rule>;
  availableComponents: RuleComponentsMap;
  availableIntegrations: Integration[];
  onSave: (rule: Partial<Rule>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function RuleForm({
  rule,
  availableComponents,
  availableIntegrations,
  onSave,
  onCancel,
  isSubmitting = false,
}: RuleFormProps) {
  const [formState, setFormState] = useState<Partial<Rule>>({
    name: "",
    description: "",
    enabled: true,
    integrationId: "",
    integrationName: "",
    triggerType: "",
    triggerConfig: {},
    conditions: [],
    actions: [],
    priority: 1,
    ...rule,
  });

  const [availableTriggers, setAvailableTriggers] = useState<
    TriggerDefinition[]
  >([]);
  const [availableConditions, setAvailableConditions] = useState<
    ConditionDefinition[]
  >([]);
  const [availableActions, setAvailableActions] = useState<ActionDefinition[]>(
    [],
  );

  // Update available components when integration changes
  useEffect(() => {
    if (!formState.integrationId) return;

    // Filter components by the selected integration
    const integrationPrefix = formState.integrationName?.toLowerCase() ?? "";

    const filteredTriggers = availableComponents.triggers.filter((trigger) =>
      trigger.type.startsWith(integrationPrefix),
    );

    const filteredConditions = availableComponents.conditions.filter(
      (condition) => condition.type.startsWith(integrationPrefix),
    );

    const filteredActions = availableComponents.actions.filter((action) =>
      action.type.startsWith(integrationPrefix),
    );

    setAvailableTriggers(filteredTriggers);
    setAvailableConditions(filteredConditions);
    setAvailableActions(filteredActions);
  }, [formState.integrationId, formState.integrationName, availableComponents]);

  // Handle form field changes
  const handleChange = <T extends keyof Rule>(field: T, value: Rule[T]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Handle integration selection
  const handleIntegrationChange = (integrationId: string) => {
    const integration = availableIntegrations.find(
      (i) => i._id === integrationId,
    );

    if (integration) {
      setFormState((prev) => ({
        ...prev,
        integrationId,
        integrationName: integration.name,
        // Reset trigger, conditions, and actions when integration changes
        triggerType: "",
        triggerConfig: {},
        conditions: [],
        actions: [],
      }));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Rule Name</Label>
          <Input
            id="name"
            value={formState.name ?? ""}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter rule name"
            required
          />
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            min={1}
            max={10}
            value={formState.priority ?? 1}
            onChange={(e) => handleChange("priority", parseInt(e.target.value))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formState.description ?? ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Describe what this rule does"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="integration">Integration</Label>
        <Select
          value={formState.integrationId ?? ""}
          onValueChange={handleIntegrationChange}
          disabled={!!rule?._id} // Disable if editing existing rule
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an integration" />
          </SelectTrigger>
          <SelectContent>
            {availableIntegrations.map((integration) => (
              <SelectItem
                key={integration._id.toString()}
                value={integration._id.toString()}
              >
                {integration.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formState.integrationId && (
        <>
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formState.enabled ?? true}
              onCheckedChange={(value) => handleChange("enabled", value)}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>

          <TriggerSelector
            availableTriggers={availableTriggers}
            selectedType={formState.triggerType ?? ""}
            config={formState.triggerConfig ?? {}}
            onSelectTrigger={(type) => handleChange("triggerType", type)}
            onConfigChange={(config) => handleChange("triggerConfig", config)}
          />

          <ConditionSelector
            availableConditions={availableConditions}
            conditions={formState.conditions ?? []}
            onConditionsChange={(conditions) =>
              handleChange("conditions", conditions)
            }
          />

          <ActionSelector
            availableActions={availableActions}
            actions={formState.actions ?? []}
            onActionsChange={(actions) => handleChange("actions", actions)}
          />

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Rule"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
