"use client";

/**
 * Scenario Editor Page
 *
 * This page allows users to create and edit automation scenarios with nodes.
 *
 * Important implementation notes:
 * - Nodes with IDs starting with "nod_" are existing nodes saved in the database
 * - New nodes have client-generated IDs (e.g., "node-1234567890")
 * - App selection is disabled for saved nodes, but enabled for new nodes
 * - When a scenario is saved, all nodes get real database IDs
 */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";
import { Activity, ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@acme/ui";

import { ScenarioForm } from "../components/ScenarioForm";
import ScenarioGraph from "../components/ScenarioGraph";
import { ScenarioHelp } from "../components/ScenarioHelp";

export default function ScenarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isCreatingMode, setIsCreatingMode] = useState(false);
  const scenarioId =
    params.id === "new" ? null : (params.id as Id<"scenarios">);

  // Fetch data to check if apps are available
  const apps =
    useQuery(api.integrations.apps.queries.list, { showDisabled: false }) ?? [];
  const existingScenario = useQuery(
    api.integrations.scenarios.queries.getById,
    scenarioId ? { id: scenarioId } : "skip",
  );

  // Check if we're in creating mode
  useEffect(() => {
    setIsCreatingMode(params.id === "new");
  }, [params.id]);

  // Show loading state if data is not loaded
  if (!apps.length) {
    return (
      <div className="container mx-auto flex items-center justify-center py-20">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading available apps and connections...</span>
      </div>
    );
  }

  // If we're editing and the scenario doesn't exist, show error
  if (!isCreatingMode && !existingScenario && scenarioId) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/integrations?tab=scenarios")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scenarios
          </Button>
          <h1 className="text-3xl font-bold text-destructive">
            Scenario Not Found
          </h1>
          <p className="text-muted-foreground">
            The scenario you're trying to edit doesn't exist or has been
            deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/integrations?tab=scenarios")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scenarios
          </Button>

          {/* Add logs navigation for existing scenarios */}
          {!isCreatingMode && scenarioId && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/admin/integrations/scenarios/${scenarioId}/logs`)
              }
            >
              <Activity className="mr-2 h-4 w-4" />
              View Logs
            </Button>
          )}
        </div>

        <h1 className="text-3xl font-bold">
          {isCreatingMode ? "Create" : "Edit"} Automation Scenario
        </h1>
        <p className="text-muted-foreground">
          Build automated workflows to connect your services and data
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <ScenarioForm
            scenarioId={scenarioId}
            isCreatingMode={isCreatingMode}
          />

          {/* Graph editor (only show when not creating, or show empty canvas later) */}
          {!isCreatingMode && <ScenarioGraph scenarioId={scenarioId} />}
        </div>

        <div>
          <ScenarioHelp />
        </div>
      </div>
    </div>
  );
}
