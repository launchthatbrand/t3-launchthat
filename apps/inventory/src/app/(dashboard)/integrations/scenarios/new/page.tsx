"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewScenarioPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create scenario mutation
  const createScenario = useMutation(
    api.integrations.scenarios.management.createScenario,
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!name.trim()) {
        throw new Error("Scenario name is required");
      }

      // Create the scenario
      const result = await createScenario({
        name: name.trim(),
        description: description.trim() || "No description provided",
      });

      // Redirect to the scenario builder
      router.push(`/integrations/scenarios/${result.scenarioId}/builder`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create scenario",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/integrations/scenarios">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scenarios
          </Link>
        </Button>
      </div>

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Create New Scenario</h1>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Scenario Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Scenario Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name for your scenario"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this scenario does"
                  className="min-h-[100px]"
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Continue to Builder
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
