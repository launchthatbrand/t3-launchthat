"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";

export default function NewScenarioPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mutations
  const createScenario = useMutation(
    api.integrations.scenarios.mutations.create,
  );
  const createSystemUser = useMutation(
    api.core.users.mutations.createSystemUserIfNeeded,
  );

  useEffect(() => {
    const createNewScenario = async () => {
      try {
        // Get or create a system user for ownership
        const systemUserId = await createSystemUser({});

        // Create a new scenario with default values
        const scenarioId = await createScenario({
          name: "New Scenario",
          description: "",
          status: "draft",
          ownerId: systemUserId,
        });

        // Redirect to the edit page
        router.push(`/admin/integrations/scenarios/${scenarioId}`);
      } catch (error) {
        console.error("Error creating scenario:", error);
        setError(
          error instanceof Error ? error.message : "Failed to create scenario",
        );
        setIsCreating(false);
      }
    };

    // Use void to explicitly mark the Promise as intentionally not awaited
    void createNewScenario();
  }, [router, createScenario, createSystemUser]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      {isCreating ? (
        <>
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-center text-lg">Creating new scenario...</p>
          <p className="text-center text-sm text-muted-foreground">
            You'll be redirected automatically
          </p>
        </>
      ) : (
        <>
          <p className="text-center text-lg text-destructive">{error}</p>
          <button
            className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
            onClick={() => router.push("/admin/integrations?tab=scenarios")}
          >
            Back to Scenarios
          </button>
        </>
      )}
    </div>
  );
}
