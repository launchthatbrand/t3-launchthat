"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui";

/**
 * ScenarioHelp component displays step-by-step instructions for building scenarios
 */
export function ScenarioHelp() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How to Build a Scenario</CardTitle>
        <CardDescription>
          Follow these steps to create your integration workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border p-3">
            <h3 className="font-medium">1. Add a Trigger</h3>
            <p className="text-sm text-muted-foreground">
              Start by configuring what will trigger your automation, such as
              retrieving WordPress posts or Monday.com items.
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <h3 className="font-medium">2. Add Action Steps</h3>
            <p className="text-sm text-muted-foreground">
              Add additional steps to process data or perform actions in other
              services. Each step can connect to a different service.
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <h3 className="font-medium">3. Configure Each Step</h3>
            <p className="text-sm text-muted-foreground">
              Select the app, connection, and specific action for each step in
              your workflow.
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <h3 className="font-medium">4. Save and Activate</h3>
            <p className="text-sm text-muted-foreground">
              After creating your scenario, you&apos;ll be able to test and
              activate it from the scenarios dashboard.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
