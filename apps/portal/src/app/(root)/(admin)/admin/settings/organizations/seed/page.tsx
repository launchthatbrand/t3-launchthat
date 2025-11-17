"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Check, Database, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

export default function OrganizationsSeedPage() {
  const [isSeeding, setIsSeeding] = useState(false);

  // Check if plans already exist
  const existingPlans = useQuery(api.core.organizations.queries.getPlans, {});

  // Seed mutation
  const seedPlans = useMutation(api.core.organizations.seed.seedPlans);

  const handleSeedPlans = async () => {
    setIsSeeding(true);
    try {
      await seedPlans({});
      toast.success("Plans seeded successfully!");
    } catch (error) {
      console.error("Error seeding plans:", error);
      toast.error("Failed to seed plans. They may already exist.");
    } finally {
      setIsSeeding(false);
    }
  };

  const hasPlans = existingPlans && existingPlans.length > 0;

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Organization Setup</h1>
          <p className="text-muted-foreground">
            Initialize the organization system with default plans
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Plans Data
            </CardTitle>
            <CardDescription>
              Seed the database with default subscription plans for
              organizations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasPlans ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Plans already exist</span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Current Plans:</h4>
                  <div className="grid gap-2">
                    {existingPlans?.map((plan: any) => (
                      <div
                        key={plan._id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <span className="font-medium">
                            {plan.displayName}
                          </span>
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({plan.name})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            ${(plan.priceMonthly / 100).toFixed(0)}/mo
                          </Badge>
                          <Badge variant="outline">
                            {plan.maxOrganizations === -1
                              ? "Unlimited"
                              : `${plan.maxOrganizations} org${plan.maxOrganizations !== 1 ? "s" : ""}`}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">No plans found</span>
                </div>

                <p className="text-sm text-muted-foreground">
                  Click the button below to create the default subscription
                  plans:
                </p>

                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    • <strong>Free</strong> - $0/month, 1 organization
                  </li>
                  <li>
                    • <strong>Starter</strong> - $29/month, 1 organization
                  </li>
                  <li>
                    • <strong>Business</strong> - $99/month, 3 organizations
                  </li>
                  <li>
                    • <strong>Agency</strong> - $199/month, unlimited
                    organizations
                  </li>
                </ul>

                <Button
                  onClick={handleSeedPlans}
                  disabled={isSeeding}
                  className="w-full"
                >
                  {isSeeding && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSeeding ? "Creating Plans..." : "Create Default Plans"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {hasPlans && (
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Plans are ready! You can now:
              </p>
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full">
                  <a href="/admin/settings/organizations">
                    Manage Organizations
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
