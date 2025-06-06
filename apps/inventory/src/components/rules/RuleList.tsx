import { useState } from "react";
import { Pencil, PlayCircle, Plus, Trash2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Switch } from "@acme/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { RuleForm } from "./RuleForm";
import { Integration, Rule, RuleComponentsMap } from "./types";

interface RuleListProps {
  rules: Rule[];
  availableComponents: RuleComponentsMap;
  availableIntegrations: Integration[];
  onCreateRule: (rule: Partial<Rule>) => Promise<void>;
  onUpdateRule: (id: string, rule: Partial<Rule>) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onToggleRule: (id: string, enabled: boolean) => Promise<void>;
  onExecuteRule: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function RuleList({
  rules,
  availableComponents,
  availableIntegrations,
  onCreateRule,
  onUpdateRule,
  onDeleteRule,
  onToggleRule,
  onExecuteRule,
  isLoading = false,
}: RuleListProps) {
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  // Handle creating a new rule
  const handleCreateRule = async (rule: Partial<Rule>) => {
    setIsSubmitting(true);
    try {
      await onCreateRule(rule);
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating rule:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating a rule
  const handleUpdateRule = async (rule: Partial<Rule>) => {
    if (!selectedRule?.id) return;

    setIsSubmitting(true);
    try {
      await onUpdateRule(selectedRule.id, rule);
      setSelectedRule(null);
    } catch (error) {
      console.error("Error updating rule:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a rule
  const handleDeleteConfirm = async () => {
    if (!ruleToDelete) return;

    try {
      await onDeleteRule(ruleToDelete);
      setShowDeleteConfirm(false);
      setRuleToDelete(null);
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  // Handle toggling a rule's enabled state
  const handleToggleRule = async (id: string, enabled: boolean) => {
    try {
      await onToggleRule(id, enabled);
    } catch (error) {
      console.error("Error toggling rule:", error);
    }
  };

  // Handle executing a rule manually
  const handleExecuteRule = async (id: string) => {
    try {
      await onExecuteRule(id);
    } catch (error) {
      console.error("Error executing rule:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Rules</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Rule</DialogTitle>
              <DialogDescription>
                Configure your rule with a trigger, conditions, and actions.
              </DialogDescription>
            </DialogHeader>
            <RuleForm
              availableComponents={availableComponents}
              availableIntegrations={availableIntegrations}
              onSave={handleCreateRule}
              onCancel={() => setIsCreating(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Integration</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead className="text-center">Priority</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  Loading rules...
                </TableCell>
              </TableRow>
            ) : rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  No rules found. Create your first rule to get started.
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>{rule.integrationName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {rule.triggerType.split(".").pop()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{rule.priority}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) =>
                        handleToggleRule(rule.id, checked)
                      }
                      aria-label={rule.enabled ? "Enabled" : "Disabled"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExecuteRule(rule.id)}
                        title="Execute rule"
                      >
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedRule(rule)}
                        title="Edit rule"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setRuleToDelete(rule.id);
                          setShowDeleteConfirm(true);
                        }}
                        title="Delete rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Rule Dialog */}
      <Dialog
        open={!!selectedRule}
        onOpenChange={(open) => !open && setSelectedRule(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
            <DialogDescription>
              Update the configuration of your rule.
            </DialogDescription>
          </DialogHeader>
          {selectedRule && (
            <RuleForm
              rule={selectedRule}
              availableComponents={availableComponents}
              availableIntegrations={availableIntegrations}
              onSave={handleUpdateRule}
              onCancel={() => setSelectedRule(null)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rule? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
