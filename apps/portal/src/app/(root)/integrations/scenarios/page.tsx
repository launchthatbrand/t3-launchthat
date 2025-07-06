"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  CalendarClock,
  Check,
  Edit,
  Play,
  PlusCircle,
  Trash,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";

import type { Id } from "../../../../../convex/_generated/dataModel";
import type {
  ColumnDefinition,
  EntityAction,
} from "../../../../components/shared/EntityList/EntityList";
import { api } from "../../../../../convex/_generated/api";
import { EntityList } from "../../../../components/shared/EntityList/EntityList";

interface ScenarioItem {
  _id: Id<"scenarios">;
  _creationTime: number;
  name: string;
  status: string;
  lastExecutedAt?: number;
  lastExecutionResult?: string;
  lastExecutionError?: string;
  schedule?: string;
}

export default function ScenariosPage() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all scenarios
  const scenarios = useQuery(api.integrations.scenarios.queries.list, {}) ?? [];

  // Mutations
  const deleteScenario = useMutation(
    api.integrations.scenarios.mutations.remove,
  );
  const updateScenarioStatus = useMutation(
    api.integrations.scenarios.mutations.updateStatus,
  );

  // Handle creating a new scenario
  const handleCreateScenario = useCallback(() => {
    router.push("/integrations/scenarios/new");
  }, [router]);

  // Handle editing a scenario
  const handleEditScenario = useCallback(
    (scenario: ScenarioItem) => {
      router.push(`/integrations/scenarios/${scenario._id}`);
    },
    [router],
  );

  // Handle running a scenario
  const handleRunScenario = useCallback(async (scenario: ScenarioItem) => {
    toast("Running scenario", {
      description: `Executing "${scenario.name}" now...`,
    });
    // TODO: Implement actual scenario execution
  }, []);

  // Handle deleting a scenario
  const handleDeleteScenario = useCallback(
    async (scenario: ScenarioItem) => {
      if (isDeleting) return;

      try {
        setIsDeleting(true);
        await deleteScenario({ id: scenario._id });
        toast("Scenario deleted", {
          description: `"${scenario.name}" has been removed.`,
        });
      } catch (error) {
        toast("Error", {
          description: `Failed to delete scenario: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteScenario, isDeleting],
  );

  // Handle activating/deactivating a scenario
  const handleToggleStatus = useCallback(
    async (scenario: ScenarioItem) => {
      const newStatus = scenario.status === "active" ? "inactive" : "active";
      try {
        await updateScenarioStatus({
          id: scenario._id,
          status: newStatus,
        });
        toast(
          `Scenario ${newStatus === "active" ? "activated" : "deactivated"}`,
          {
            description: `"${scenario.name}" is now ${newStatus}.`,
          },
        );
      } catch (error) {
        toast("Error", {
          description: `Failed to update scenario status: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    },
    [updateScenarioStatus],
  );

  // Define entity actions for the scenarios
  const entityActions: EntityAction<ScenarioItem>[] = [
    {
      id: "edit",
      label: "Edit",
      icon: <Edit className="mr-2 h-4 w-4" />,
      onClick: handleEditScenario,
    },
    {
      id: "run",
      label: "Run Now",
      icon: <Play className="mr-2 h-4 w-4" />,
      onClick: handleRunScenario,
    },
    {
      id: "toggle-status",
      label: (scenario) =>
        scenario.status === "active" ? "Deactivate" : "Activate",
      icon: <Check className="mr-2 h-4 w-4" />,
      onClick: handleToggleStatus,
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash className="mr-2 h-4 w-4" />,
      onClick: handleDeleteScenario,
      variant: "destructive",
    },
  ];

  // Define columns for the EntityList
  const columns: ColumnDefinition<ScenarioItem>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: (scenario) => <div className="font-medium">{scenario.name}</div>,
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (scenario) => (
        <div className="flex items-center">
          <div
            className={`mr-2 h-2 w-2 rounded-full ${
              scenario.status === "active"
                ? "bg-green-500"
                : scenario.status === "error"
                  ? "bg-red-500"
                  : "bg-yellow-500"
            }`}
          />
          <span className="capitalize">{scenario.status}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: "schedule",
      header: "Schedule",
      accessorKey: "schedule",
      cell: (scenario) => (
        <div className="flex items-center">
          {scenario.schedule ? (
            <>
              <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{scenario.schedule}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Manual execution only</span>
          )}
        </div>
      ),
    },
    {
      id: "lastExecuted",
      header: "Last Executed",
      accessorKey: "lastExecutedAt",
      cell: (scenario) => (
        <div>
          {scenario.lastExecutedAt ? (
            <span>{new Date(scenario.lastExecutedAt).toLocaleString()}</span>
          ) : (
            <span className="text-muted-foreground">Never</span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (scenario) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditScenario(scenario)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRunScenario(scenario)}
          >
            <Play className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                ...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleToggleStatus(scenario)}>
                {scenario.status === "active" ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteScenario(scenario)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-bold">Automation Scenarios</h1>
        <p className="text-muted-foreground">
          Create and manage automated workflows to connect your services
        </p>
      </div>

      <EntityList<ScenarioItem>
        data={scenarios}
        columns={columns}
        isLoading={scenarios.length === 0}
        entityActions={entityActions}
        onRowClick={handleEditScenario}
        title="Scenarios"
        actions={
          <Button onClick={handleCreateScenario}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Scenario
          </Button>
        }
        filters={[
          {
            id: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Active", value: "active" },
              { label: "Draft", value: "draft" },
              { label: "Error", value: "error" },
              { label: "Inactive", value: "inactive" },
            ],
            field: "status",
          },
        ]}
        emptyState={
          <div className="py-24 text-center">
            <h3 className="text-lg font-medium">No scenarios found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating your first automation scenario.
            </p>
            <Button className="mt-4" onClick={handleCreateScenario}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Scenario
            </Button>
          </div>
        }
        viewModes={["list", "grid"]}
        defaultViewMode="list"
      />
    </div>
  );
}
