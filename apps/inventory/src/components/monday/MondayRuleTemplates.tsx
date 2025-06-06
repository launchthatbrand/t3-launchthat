import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { Rule } from "../rules/types";

export interface MondayRuleTemplate {
  id: string;
  name: string;
  description: string;
  template: Partial<Rule>;
}

export interface MondayRuleTemplatesProps {
  onSelectTemplate: (template: Partial<Rule>) => void;
}

export function MondayRuleTemplates({
  onSelectTemplate,
}: MondayRuleTemplatesProps) {
  // Define common rule templates for Monday integration
  const templates: MondayRuleTemplate[] = [
    {
      id: "status-change-notification",
      name: "Status Change Notification",
      description:
        "Send a notification when an item's status changes to a specific value",
      template: {
        name: "Status Change Notification",
        description: "Send a notification when an item status changes to Done",
        enabled: true,
        triggerType: "monday.status_changed",
        triggerConfig: {
          boardId: "",
        },
        conditions: [
          {
            type: "monday.status_equals",
            config: {
              value: "Done",
            },
          },
        ],
        actions: [
          {
            type: "monday.send_notification",
            config: {
              message: "Item {{item.name}} is now Done",
              userIds: [],
            },
          },
        ],
        priority: 5,
      },
    },
    {
      id: "item-created-sync",
      name: "New Item Sync",
      description: "When a new item is created, copy it to another board",
      template: {
        name: "New Item Sync",
        description: "Copy new items to another board automatically",
        enabled: true,
        triggerType: "monday.item_created",
        triggerConfig: {
          boardId: "",
        },
        conditions: [],
        actions: [
          {
            type: "monday.create_item",
            config: {
              boardId: "",
              itemName: "{{item.name}}",
              columnValues: {
                status: "New",
                text: "{{item.text}}",
                date: "{{item.date}}",
              },
            },
          },
        ],
        priority: 10,
      },
    },
    {
      id: "date-reminder",
      name: "Date Reminder",
      description: "Send a reminder when a due date is approaching",
      template: {
        name: "Due Date Reminder",
        description:
          "Send a notification when an item's due date is approaching",
        enabled: true,
        triggerType: "monday.scheduled",
        triggerConfig: {
          schedule: "daily",
          time: "09:00",
        },
        conditions: [
          {
            type: "monday.date_within_days",
            config: {
              dateField: "due_date",
              days: 2,
            },
          },
        ],
        actions: [
          {
            type: "monday.send_notification",
            config: {
              message:
                "Item {{item.name}} is due in less than 2 days ({{item.due_date}})",
              userIds: [],
              sendEmail: true,
            },
          },
        ],
        priority: 5,
      },
    },
    {
      id: "status-update-on-date",
      name: "Auto-Update Status on Date",
      description:
        "Automatically update an item's status when a date is reached",
      template: {
        name: "Auto-Update Status on Date",
        description: "Change item status to 'Overdue' when due date has passed",
        enabled: true,
        triggerType: "monday.scheduled",
        triggerConfig: {
          schedule: "daily",
          time: "00:01",
        },
        conditions: [
          {
            type: "monday.date_passed",
            config: {
              dateField: "due_date",
            },
          },
          {
            type: "monday.status_not_equals",
            config: {
              value: "Done",
            },
          },
        ],
        actions: [
          {
            type: "monday.update_column_value",
            config: {
              columnId: "status",
              value: "Overdue",
            },
          },
        ],
        priority: 5,
      },
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Rule Templates</h2>
      <p className="text-muted-foreground">
        Get started quickly with these common automation templates for
        Monday.com.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className="border-2 hover:border-primary">
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Trigger:</span>{" "}
                  {template.template.triggerType?.split(".")[1]}
                </div>
                {template.template.conditions?.length ? (
                  <div>
                    <span className="font-medium">Conditions:</span>{" "}
                    {template.template.conditions.length} condition(s)
                  </div>
                ) : (
                  <div>
                    <span className="font-medium">Conditions:</span> None
                  </div>
                )}
                <div>
                  <span className="font-medium">Actions:</span>{" "}
                  {template.template.actions?.length} action(s)
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onSelectTemplate(template.template)}
              >
                Use This Template
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
