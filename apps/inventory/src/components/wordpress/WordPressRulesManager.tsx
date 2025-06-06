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

export interface WordPressRulesManagerProps {
  integrationId: string;
}

export function WordPressRulesManager({
  integrationId,
}: WordPressRulesManagerProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the WordPress integration
  const integration = useQuery(api.integrations.test.testQuery) as any;

  // Fetch all rules for this integration
  const rules = useQuery(api.integrations.test.testQuery) as any;

  // Fetch available rule components (triggers, conditions, actions) for WordPress
  const ruleComponents = useQuery(api.integrations.test.testQuery) as any;

  // Fetch all integrations (for the rule form)
  const integrations = useQuery(api.integrations.test.testQuery) as any;

  // Mutations
  const createRule = useMutation(api.integrations.test.testMutation);
  const updateRule = useMutation(api.integrations.test.testMutation);
  const deleteRule = useMutation(api.integrations.test.testMutation);
  const toggleRule = useMutation(api.integrations.test.testMutation);
  const executeRule = useMutation(api.integrations.test.testMutation);

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
      await createRule({ name: "Test Create Rule" });
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
      await updateRule({ name: "Test Update Rule" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteRule({ name: "Test Delete Rule" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    }
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    try {
      await toggleRule({
        name: `Test Toggle Rule (${enabled ? "enabled" : "disabled"})`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle rule");
    }
  };

  const handleExecuteRule = async (id: string) => {
    try {
      await executeRule({ name: "Test Execute Rule" });
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

  // For testing purposes, let's create mock data
  const mockIntegration = {
    _id: integrationId,
    name: "WordPress Test Integration",
  };

  const mockRules = [
    {
      _id: "rule1",
      name: "Test Rule 1",
      description: "This is a test rule",
      enabled: true,
      executionCount: 5,
      lastRun: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      _id: "rule2",
      name: "Test Rule 2",
      description: "This is another test rule",
      enabled: false,
      executionCount: 0,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockRuleComponents = {
    triggers: [
      {
        id: "trigger1",
        name: "Post Published",
        description: "Triggered when a post is published",
      },
    ],
    actions: [
      { id: "action1", name: "Create Post", description: "Create a new post" },
    ],
    conditions: [
      { id: "condition1", name: "Post Type", description: "Check post type" },
    ],
  };

  const mockIntegrations = [mockIntegration];

  // Use mock data instead of the actual data for testing
  const displayIntegration = mockIntegration;
  const filteredRules = mockRules.filter((rule) => {
    if (activeTab === "all") return true;
    if (activeTab === "enabled") return rule.enabled;
    if (activeTab === "disabled") return !rule.enabled;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">WordPress Automation Rules</h1>
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
              {rules.reduce((sum, rule) => sum + (rule.executionCount ?? 0), 0)}
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
          {filteredRules.length === 0 ? (
            <Card>
              <CardContent className="pb-6 pt-6 text-center">
                <p className="mb-4 text-muted-foreground">No rules found</p>
                <Button onClick={() => setIsCreating(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Your First Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create WordPress Automation Rule</DialogTitle>
            <DialogDescription>
              Configure a rule that will execute when events occur in your
              WordPress site.
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

      {/* WordPress Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>WordPress Automation Help</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Available Triggers</h3>
              <ul className="mt-2 list-disc pl-6">
                <li>
                  <strong>Post Published</strong> - Triggered when a new post is
                  published
                </li>
                <li>
                  <strong>Post Updated</strong> - Triggered when a post is
                  updated
                </li>
                <li>
                  <strong>Comment Added</strong> - Triggered when a new comment
                  is added
                </li>
                <li>
                  <strong>User Registered</strong> - Triggered when a new user
                  registers
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium">Available Actions</h3>
              <ul className="mt-2 list-disc pl-6">
                <li>
                  <strong>Create Post</strong> - Create a new post in WordPress
                </li>
                <li>
                  <strong>Update Post</strong> - Update an existing post in
                  WordPress
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
                  WordPress webhooks require the WordPress Webhooks plugin to be
                  installed on your site
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
