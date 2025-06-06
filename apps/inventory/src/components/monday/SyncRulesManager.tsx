"use client";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { PlusIcon, Settings2Icon, Trash2Icon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { EntityList } from "../shared/EntityList/EntityList";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@acme/ui/skeleton";
import { Switch } from "@acme/ui/switch";
import { SyncRuleForm } from "./SyncRuleForm";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { useState } from "react";

// Define the board mapping type
interface BoardMapping {
  _id: string;
  mondayBoardName: string;
  convexTableName: string;
  convexTableDisplayName?: string;
}

// Define the sync rule type
interface SyncRule {
  _id: Id<"mondaySyncRules">;
  name: string;
  description?: string;
  isEnabled: boolean;
  boardMappingId: string;
  triggerType: string;
  triggerTable: string;
  triggerField?: string;
  triggerValue?: string;
  actionType: string;
  executionCount?: number;
  lastExecuted?: number;
}

// Define the stats type
interface SyncRuleStats {
  totalExecutions: number;
  successRate: number;
  averageTimeTaken: number;
}

export interface SyncRulesManagerProps {
  integrationId: Id<"mondayIntegration">;
}

export function SyncRulesManager({ integrationId }: SyncRulesManagerProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  const [editingRuleId, setEditingRuleId] =
    useState<Id<"mondaySyncRules"> | null>(null);

  // Fetch integration details
  const integration = useQuery(api.monday.queries.getIntegration, {
    id: integrationId,
  });

  // Fetch all rules for this integration
  const rules = useQuery(api.monday.queries.getSyncRules, { integrationId }) as
    | SyncRule[]
    | undefined;

  // Fetch board mappings for this integration
  const boardMappings = useQuery(api.monday.queries.getBoardMappings, {
    integrationId,
  }) as BoardMapping[] | undefined;

  // Get rule execution stats
  const stats = useQuery(api.monday.queries.getSyncRuleExecutionStats, {}) as
    | SyncRuleStats
    | undefined;

  // Mutations
  const toggleRule = useMutation(api.monday.mutations.toggleSyncRule);
  const deleteRule = useMutation(api.monday.mutations.deleteSyncRule);
  const triggerRule = useMutation(api.monday.mutations.triggerSyncRule);

  if (!integration || !rules || !boardMappings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Filter rules based on active tab
  const filteredRules = rules.filter((rule) => {
    if (activeTab === "all") return true;
    if (activeTab === "enabled") return rule.isEnabled;
    if (activeTab === "disabled") return !rule.isEnabled;
    return true;
  });

  const handleToggleRule = async (
    ruleId: Id<"mondaySyncRules">,
    isEnabled: boolean,
  ) => {
    await toggleRule({ ruleId, isEnabled: !isEnabled });
  };

  const handleDeleteRule = async (ruleId: Id<"mondaySyncRules">) => {
    if (
      window.confirm(
        "Are you sure you want to delete this rule? This action cannot be undone.",
      )
    ) {
      await deleteRule({ ruleId });
    }
  };

  const handleTriggerRule = async (
    ruleId: Id<"mondaySyncRules">,
    documentId: string,
  ) => {
    await triggerRule({ ruleId, documentId });
  };

  const handleEditRule = (ruleId: Id<"mondaySyncRules">) => {
    setEditingRuleId(ruleId);
  };

  const columns = [
    {
      id: "name",
      header: "Rule Name",
      cell: (rule: SyncRule) => (
        <div className="flex flex-col gap-1">
          <div className="font-medium">{rule.name}</div>
          <div className="text-sm text-muted-foreground">
            {rule.description ?? "No description"}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (rule: SyncRule) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={rule.isEnabled}
            onCheckedChange={() => handleToggleRule(rule._id, rule.isEnabled)}
          />
          <Badge
            variant={rule.isEnabled ? "outline" : "default"}
            className={
              rule.isEnabled
                ? "border-green-200 bg-green-50 text-green-700"
                : ""
            }
          >
            {rule.isEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      ),
    },
    {
      id: "trigger",
      header: "Trigger",
      cell: (rule: SyncRule) => (
        <div className="flex flex-col gap-1">
          <Badge variant="outline">{rule.triggerType}</Badge>
          <div className="text-sm">{rule.triggerTable}</div>
          {rule.triggerField && (
            <div className="text-xs text-muted-foreground">
              {rule.triggerField}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: (rule: SyncRule) => (
        <div className="flex flex-col gap-1">
          <Badge variant="outline">{rule.actionType}</Badge>
          <div className="text-sm">
            {boardMappings.find((bm) => bm._id === rule.boardMappingId)
              ?.mondayBoardName ?? "Unknown board"}
          </div>
        </div>
      ),
    },
    {
      id: "executionInfo",
      header: "Execution Info",
      cell: (rule: SyncRule) => (
        <div className="flex flex-col gap-1">
          <div className="text-sm">
            {rule.executionCount
              ? `${rule.executionCount} executions`
              : "Never executed"}
          </div>
          {rule.lastExecuted && (
            <div className="text-xs text-muted-foreground">
              Last run: {format(rule.lastExecuted, "MMM d, yyyy h:mm a")}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (rule: SyncRule) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditRule(rule._id)}
          >
            <Settings2Icon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteRule(rule._id)}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sync Rules</h2>
          <p className="text-muted-foreground">
            Create event-based synchronization rules for Monday.com integration
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
            <p className="text-xs text-muted-foreground">
              {rules.filter((r) => r.isEnabled).length} active /{" "}
              {rules.filter((r) => !r.isEnabled).length} disabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Rule Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalExecutions ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Success rate: {((stats?.successRate ?? 0) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.averageTimeTaken ?? 0).toFixed(0)} ms
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Rules List */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Rules</TabsTrigger>
          <TabsTrigger value="enabled">Enabled</TabsTrigger>
          <TabsTrigger value="disabled">Disabled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredRules.length === 0 ? (
            <Alert>
              <AlertTitle>No rules found</AlertTitle>
              <AlertDescription>
                {activeTab === "all"
                  ? "You haven't created any sync rules yet. Click the 'Create Rule' button to get started."
                  : `No ${activeTab} rules found.`}
              </AlertDescription>
            </Alert>
          ) : (
            <EntityList
              data={filteredRules}
              columns={columns}
              actions={[
                {
                  label: "Edit",
                  icon: "Settings",
                  onClick: (rule) =>
                    handleEditRule(rule._id as Id<"mondaySyncRules">),
                },
                {
                  label: "Delete",
                  icon: "Trash",
                  onClick: (rule) =>
                    handleDeleteRule(rule._id as Id<"mondaySyncRules">),
                },
              ]}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Sync Rule</DialogTitle>
            <DialogDescription>
              Create a rule to automate synchronization between Convex and
              Monday.com
            </DialogDescription>
          </DialogHeader>

          <SyncRuleForm
            integrationId={integrationId}
            boardMappings={boardMappings}
            onSuccess={() => setIsCreating(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      {editingRuleId && (
        <Dialog
          open={!!editingRuleId}
          onOpenChange={(open) => !open && setEditingRuleId(null)}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Sync Rule</DialogTitle>
              <DialogDescription>
                Modify the configuration of this sync rule
              </DialogDescription>
            </DialogHeader>

            <SyncRuleForm
              integrationId={integrationId}
              boardMappings={boardMappings}
              ruleId={editingRuleId}
              onSuccess={() => setEditingRuleId(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
