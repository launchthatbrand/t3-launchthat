"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  AlertCircle,
  Clock,
  FileCheck,
  FileCog,
  FilePlus,
  FileWarning,
  Play,
  Plus,
  Search,
} from "lucide-react";

export default function ScenariosPage() {
  const [activeTab, setActiveTab] = useState("all");

  // Fetch all scenarios
  const scenarios = useQuery(
    api.integrations.scenarios.management.getUserScenarios,
    {},
  );

  // Filter scenarios based on active tab
  const filteredScenarios = scenarios?.filter((scenario) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return scenario.status === "active";
    if (activeTab === "draft") return scenario.status === "draft";
    if (activeTab === "paused") return scenario.status === "paused";
    return true;
  });

  return (
    <div className="container py-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Integration Scenarios</h1>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/integrations/executions">
              <Clock className="mr-2 h-4 w-4" />
              View Executions
            </Link>
          </Button>

          <Button size="sm" asChild>
            <Link href="/integrations/scenarios/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Scenario
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Scenarios</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search scenarios..."
                className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {!scenarios ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900"></div>
                    <p className="mt-4 text-sm text-gray-500">
                      Loading scenarios...
                    </p>
                  </div>
                </div>
              ) : scenarios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FilePlus className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">No scenarios yet</h3>
                  <p className="mt-2 max-w-md text-sm text-gray-500">
                    Create your first integration scenario to automate workflows
                    between your apps and services.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/integrations/scenarios/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Scenario
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredScenarios?.map((scenario) => (
                    <Link
                      key={scenario._id.toString()}
                      href={`/integrations/scenarios/${scenario._id}`}
                      className="group"
                    >
                      <div className="rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="font-medium transition-colors group-hover:text-blue-600">
                            {scenario.name}
                          </h3>

                          {/* Status indicator */}
                          {scenario.status === "active" && (
                            <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                              Active
                            </div>
                          )}
                          {scenario.status === "draft" && (
                            <div className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                              Draft
                            </div>
                          )}
                          {scenario.status === "paused" && (
                            <div className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                              Paused
                            </div>
                          )}
                          {scenario.status === "error" && (
                            <div className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                              Error
                            </div>
                          )}
                        </div>

                        <p className="mb-4 line-clamp-2 text-sm text-gray-500">
                          {scenario.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <FileCog className="mr-1 h-4 w-4" />
                            {scenario.nodeCount} nodes
                          </div>

                          {scenario.lastRun ? (
                            <div>
                              <Clock className="mr-1 inline-block h-3 w-3" />
                              Last run:{" "}
                              {new Date(scenario.lastRun).toLocaleDateString()}
                            </div>
                          ) : (
                            <div>Never run</div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
