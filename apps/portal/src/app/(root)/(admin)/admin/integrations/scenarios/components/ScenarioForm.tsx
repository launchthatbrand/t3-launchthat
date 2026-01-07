"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import type { Id } from "@convex-config/_generated/dataModel";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Save } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
} from "@acme/ui";

import type { App, Connection , FormValues } from "../types";
import { formSchema } from "../types";
import { validateScenarioForm } from "../utils";
import ScenarioGraph from "./ScenarioGraph";

interface ScenarioFormProps {
  scenarioId: Id<"scenarios"> | null;
  isCreatingMode: boolean;
}

/**
 * ScenarioForm component handles the form for creating/editing a scenario
 */
export function ScenarioForm({
  scenarioId,
  isCreatingMode,
}: ScenarioFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // Fetch data
  const fetchedApps =
    useQuery(api.integrations.apps.queries.list, { showDisabled: false }) ?? [];
  const fetchedConnections =
    useQuery(api.integrations.connections.queries.list, {}) ?? [];
  const systemUser = useQuery(api.core.users.queries.getSystemUser);
  const existingScenario = useQuery(
    api.integrations.scenarios.queries.getById,
    scenarioId ? { id: scenarioId } : "skip",
  );

  // Memoise for stability
  const { apps, connections } = useMemo(
    () => ({
      apps: [...fetchedApps] as App[],
      connections: [...fetchedConnections] as Connection[],
    }),
    [fetchedApps, fetchedConnections],
  );

  // Mutations
  const createScenario = useMutation(
    api.integrations.scenarios.mutations.create,
  );
  const updateScenario = useMutation(
    api.integrations.scenarios.mutations.update,
  );

  // Set up form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  // Load existing scenario data (name only)
  useEffect(() => {
    if (isInitialDataLoaded) return;
    if (existingScenario) {
      form.reset({ name: existingScenario.name as string });
      setIsInitialDataLoaded(true);
    }
  }, [existingScenario, form, isInitialDataLoaded]);

  const handleSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Ensure system user exists
      let ownerId = systemUser?._id;
      if (!ownerId)
        ownerId = await api.core.users.mutations.createSystemUserIfNeeded(
          {} as any,
        );

      if (!ownerId) throw new Error("Failed to determine owner");

      if (!scenarioId) {
        const newId = await createScenario({
          name: values.name,
          description: "",
          status: "draft",
          ownerId,
        });
        router.push(`/admin/integrations/scenarios/${newId}`);
      } else {
        await updateScenario({ id: scenarioId, name: values.name });
        toast.success("Scenario details saved");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save scenario",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const canCreateScenario = apps.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Details</CardTitle>
        <CardDescription>Configure your automation scenario</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scenario Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Integration Workflow" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for your automation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-6" />

            <div>
              <h3 className="mb-4 text-lg font-medium">Workflow Steps</h3>
              {/* Replace legacy list with React Flow graph */}
              {!isCreatingMode && <ScenarioGraph scenarioId={scenarioId} />}
            </div>

            <div className="flex justify-end space-x-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/integrations?tab=scenarios")}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSaving || !canCreateScenario}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCreatingMode ? "Creating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isCreatingMode ? "Create" : "Save"} Scenario
                  </>
                )}
              </Button>
            </div>

            {!canCreateScenario && (
              <p className="mt-2 text-center text-sm text-yellow-600">
                You need available apps and connections to create a scenario.
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
