import { Card, CardContent } from "@acme/ui/card";

import { Rule } from "../rules/types";

export interface MondayRuleSummaryProps {
  rule: Rule;
}

// Commenting out unused function for now, will use when board data is available
// Helper function to get a human-readable board name
/* const getBoardName = (boardId: string, boards: { id: string; name: string }[] = []): string => {
  const board = boards.find((b) => b.id === boardId);
  return board ? board.name : `Board ${boardId}`;
}; */

export function MondayRuleSummary({ rule }: MondayRuleSummaryProps) {
  // Generate human-readable descriptions of rule components
  const triggerDescription = getMondayTriggerDescription(
    rule.triggerType,
    rule.triggerConfig,
  );
  const conditionsDescription = getMondayConditionsDescription(rule.conditions);
  const actionsDescription = getMondayActionsDescription(rule.actions);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-800">When</h3>
            <p className="mt-1 text-gray-600">{triggerDescription}</p>
          </div>

          {rule.conditions.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-800">If</h3>
              <p className="mt-1 text-gray-600">{conditionsDescription}</p>
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-800">Then</h3>
            <p className="mt-1 text-gray-600">{actionsDescription}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions to generate human-readable descriptions
function getMondayTriggerDescription(
  type: string,
  config: Record<string, unknown>,
): string {
  const triggerType = type.split(".").pop() ?? "";

  switch (triggerType) {
    case "item_created":
      return `A new item is created in a Monday.com board`;
    case "status_changed":
      return `An item's status column changes in a Monday.com board`;
    case "scheduled": {
      const schedule = config.schedule as string;
      const time = config.time as string;
      return `On a ${schedule} schedule at ${time}`;
    }
    case "field_updated": {
      const fieldName = config.fieldName as string;
      return `The "${fieldName}" field is updated on an item`;
    }
    default:
      return type;
  }
}

function getMondayConditionsDescription(
  conditions: { type: string; config: Record<string, unknown> }[],
): string {
  if (!conditions.length) return "No conditions";

  return conditions
    .map((condition) => {
      const conditionType = condition.type.split(".").pop() ?? "";

      switch (conditionType) {
        case "status_equals":
          return `Status equals "${String(condition.config.value)}"`;
        case "status_not_equals":
          return `Status is not "${String(condition.config.value)}"`;
        case "date_within_days":
          return `Date field "${String(condition.config.dateField)}" is within ${String(condition.config.days)} days`;
        case "date_passed":
          return `Date field "${String(condition.config.dateField)}" has passed`;
        case "field_contains":
          return `Field "${String(condition.config.fieldName)}" contains "${String(condition.config.value)}"`;
        case "priority_above":
          return `Priority is above ${String(condition.config.value)}`;
        default:
          return conditionType;
      }
    })
    .join(" AND ");
}

function getMondayActionsDescription(
  actions: { type: string; config: Record<string, unknown> }[],
): string {
  if (!actions.length) return "No actions";

  return actions
    .map((action) => {
      const actionType = action.type.split(".").pop() ?? "";

      switch (actionType) {
        case "send_notification":
          return `Send a notification with message: "${String(action.config.message)}"`;
        case "create_item":
          return `Create a new item in a Monday.com board`;
        case "update_column_value":
          return `Update the "${String(action.config.columnId)}" column to "${String(action.config.value)}"`;
        case "move_to_group":
          return `Move the item to group "${String(action.config.groupName)}"`;
        default:
          return actionType;
      }
    })
    .join(" AND ");
}
