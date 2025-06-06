"use client";

import { useState } from "react";
import ExecutionMetrics from "@/components/integrations/dashboard/ExecutionMetrics";
import ScenarioPerformance from "@/components/integrations/dashboard/ScenarioPerformance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";

/**
 * Integration Performance Dashboard
 *
 * Provides analytics, metrics, and performance insights for integration scenarios
 */
export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    null,
  );

  // Get all scenarios for the dropdown
  const scenarios = useQuery(api.integrations.scenarios.getScenarios);

  // If we don't have a selected scenario yet, set it to the first one
  if (scenarios && scenarios.length > 0 && !selectedScenarioId) {
    setSelectedScenarioId(scenarios[0]._id);
  }

  return (
    <div className="container space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scenario">Scenario Analysis</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="mt-0 space-y-6">
            <ExecutionMetrics />
          </TabsContent>

          <TabsContent value="scenario" className="mt-0">
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">
                Select Scenario
              </label>
              {scenarios ? (
                <Select
                  value={selectedScenarioId || ""}
                  onValueChange={(value) => setSelectedScenarioId(value)}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select a scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((scenario) => (
                      <SelectItem key={scenario._id} value={scenario._id}>
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading scenarios...</span>
                </div>
              )}
            </div>

            {selectedScenarioId ? (
              <ScenarioPerformance scenarioId={selectedScenarioId} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Performance</CardTitle>
                  <CardDescription>
                    Select a scenario to view its performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">No scenario selected</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
