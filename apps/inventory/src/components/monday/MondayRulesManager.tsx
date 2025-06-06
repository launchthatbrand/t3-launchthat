import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Skeleton } from "@acme/ui/skeleton";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { RuleForm, RuleList } from "../rules";
import { Integration, Rule, RuleComponentsMap } from "../rules/types";

export interface MondayRulesManagerProps {
  integrationId: string; // Allow any integration ID
}

export function MondayRulesManager({ integrationId }: MondayRulesManagerProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the Monday integration
  const integration = useQuery(api.monday.queries.getIntegration, {
    id: integrationId,
  }) as Integration | undefined;

  // Fetch all rules for this integration
  const rules = useQuery(api.rules.queries.getRulesByIntegration, {
    integrationId: integrationId.toString(),
  }) as Rule[] | undefined;

  // Fetch available rule components (triggers, conditions, actions) for Monday
  const ruleComponents = useQuery(api.rules.queries.getAvailableComponents, {
    integrationPrefix: "monday",
  }) as RuleComponentsMap | undefined;

  // Fetch all integrations (for the rule form)
  const integrations = useQuery(api.rules.queries.getIntegrations) as
    | Integration[]
    | undefined;

  // Mutations
  const createRule = useMutation(api.rules.mutations.createRule);
  const updateRule = useMutation(api.rules.mutations.updateRule);
  const deleteRule = useMutation(api.rules.mutations.deleteRule);
  const toggleRule = useMutation(api.rules.mutations.toggleRule);
  const executeRule = useMutation(api.rules.mutations.executeRule);

  // Filter rules based on active tab
  const filteredRules = rules
    ? rules.filter((rule) => {
        if (activeTab === "all") return true;
        if (activeTab === "enabled") return rule.enabled;
        if (activeTab === "disabled") return !rule.enabled;
        return true;
      })
    : [];

  const handleCreateRule = async (rule: Partial<Rule>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createRule({ rule: rule as Rule });
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRule = async (id: string, rule: Partial<Rule>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateRule({ id, rule: rule as Rule });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteRule({ id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    }
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    try {
      await toggleRule({ id, enabled });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle rule");
    }
  };

  const handleExecuteRule = async (id: string) => {
    try {
      await executeRule({ id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute rule");
    }
  };

  // Show loading state
  if (!integration || !rules || !ruleComponents || !integrations) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Monday Automation Rules</h1>
        <Button onClick={() => setIsCreating(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules.filter((r) => r.enabled).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules.reduce((sum, rule) => sum + (rule.executionCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Rules</TabsTrigger>
          <TabsTrigger value="enabled">Enabled</TabsTrigger>
          <TabsTrigger value="disabled">Disabled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <RuleList
            rules={filteredRules}
            availableComponents={ruleComponents}
            availableIntegrations={integrations}
            onCreateRule={handleCreateRule}
            onUpdateRule={handleUpdateRule}
            onDeleteRule={handleDeleteRule}
            onToggleRule={handleToggleRule}
            onExecuteRule={handleExecuteRule}
            isLoading={false}
          />
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Monday Automation Rule</DialogTitle>
            <DialogDescription>
              Configure a rule that will execute when conditions are met in your
              Monday.com boards.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
              <p className="text-sm">{error}</p>
            </div>
          )}
          <RuleForm
            availableComponents={ruleComponents}
            availableIntegrations={[integration]}
            onSave={handleCreateRule}
            onCancel={() => setIsCreating(false)}
            isSubmitting={isSubmitting}
            rule={{
              integrationId: integrationId.toString(),
              integrationName: integration.name,
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Monday Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Monday.com Automation Help</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Available Triggers</h3>
              <ul className="mt-2 list-disc pl-6">
                <li>
                  <strong>Item Created</strong> - Triggered when a new item is
                  added to a board
                </li>
                <li>
                  <strong>Status Changed</strong> - Triggered when an item's
                  status column changes
                </li>
                <li>
                  <strong>Field Updated</strong> - Triggered when a specific
                  field is updated
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium">Available Actions</h3>
              <ul className="mt-2 list-disc pl-6">
                <li>
                  <strong>Create Item</strong> - Create a new item in a Monday
                  board
                </li>
                <li>
                  <strong>Update Item</strong> - Update an existing item in a
                  Monday board
                </li>
                <li>
                  <strong>Create Convex Document</strong> - Create a new
                  document in a Convex table
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium">Tips</h3>
              <ul className="mt-2 list-disc pl-6">
                <li>
                  Rules only execute when the integration is enabled and the
                  specific rule is enabled
                </li>
                <li>
                  You can manually test a rule by clicking the "Execute" button
                </li>
                <li>
                  Monday.com webhooks might have a delay before they're fully
                  registered
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
