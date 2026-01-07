"use client";

import React from "react";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { Clock, Layers, Package, Tag } from "lucide-react";

import { cn } from "@acme/ui";
import { EntityList } from "@acme/ui/advanced/entity-list";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

// Integration Node type based on the Convex query return type
interface IntegrationNode {
  _id: string;
  _creationTime: number;
  identifier: string;
  name: string;
  category: string;
  integrationType: string;
  description: string;
  version: string;
  deprecated?: boolean;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

// Category color mapping
const categoryColors = {
  action: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  trigger: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  transformer:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  system: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  source:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  destination: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

// Integration type color mapping
const integrationTypeColors = {
  wordpress: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  stripe:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  monday: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  system: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  email:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  webhook:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
};

function IntegrationNodeCard({
  node,
  viewMode,
}: {
  node: IntegrationNode;
  viewMode: "list" | "grid";
}) {
  const isDeprecated = node.deprecated;
  const isListView = viewMode === "list";

  return (
    <Card
      className={cn(
        "border transition-all duration-200 hover:shadow-md",
        isDeprecated && "border-orange-200 opacity-60",
        isListView ? "mb-2" : "h-full",
      )}
    >
      <CardHeader className={cn("pb-3", isListView && "py-3")}>
        <div
          className={cn(
            "flex items-start justify-between",
            isListView ? "flex-row" : "flex-col",
          )}
        >
          <div className={cn(isListView ? "flex-1" : "w-full")}>
            <CardTitle
              className={cn("text-lg font-semibold", isListView && "text-base")}
            >
              {node.name}
              {isDeprecated && (
                <Badge
                  variant="outline"
                  className="ml-2 border-orange-200 bg-orange-50 text-xs text-orange-700"
                >
                  Deprecated
                </Badge>
              )}
            </CardTitle>
            <p
              className={cn(
                "mt-1 text-sm text-muted-foreground",
                isListView && "text-xs",
              )}
            >
              {node.identifier}
            </p>
          </div>

          <div
            className={cn(
              "flex gap-2",
              isListView ? "ml-4 flex-row" : "mt-3 flex-wrap",
            )}
          >
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                categoryColors[node.category as keyof typeof categoryColors] ||
                  categoryColors.system,
              )}
            >
              <Layers className="mr-1 h-3 w-3" />
              {node.category}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                integrationTypeColors[
                  node.integrationType as keyof typeof integrationTypeColors
                ] || integrationTypeColors.system,
              )}
            >
              <Package className="mr-1 h-3 w-3" />
              {node.integrationType}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-0", isListView && "py-2")}>
        <p
          className={cn(
            "mb-3 text-sm text-muted-foreground",
            isListView && "mb-2 text-xs",
          )}
        >
          {node.description}
        </p>

        <div
          className={cn(
            "flex items-center justify-between",
            isListView && "flex-col items-start gap-2",
          )}
        >
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>v{node.version}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(node.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {node.tags && node.tags.length > 0 && (
            <div className={cn("flex flex-wrap gap-1", isListView && "mt-1")}>
              {node.tags.slice(0, isListView ? 2 : 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-gray-200 bg-gray-50 px-2 py-0 text-xs text-gray-600"
                >
                  {tag}
                </Badge>
              ))}
              {node.tags.length > (isListView ? 2 : 3) && (
                <Badge
                  variant="outline"
                  className="border-gray-200 bg-gray-50 px-2 py-0 text-xs text-gray-600"
                >
                  +{node.tags.length - (isListView ? 2 : 3)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AppsPage() {
  const integrationNodes = useQuery(
    api.integrations.integrationNodes.queries.getAllIntegrationNodes,
    {},
  );

  // Loading state
  if (integrationNodes === undefined) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Integration Apps</h1>
          <p className="text-muted-foreground">
            Available integration node definitions that can be used in
            automation scenarios.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-3 w-1/2 rounded bg-gray-200"></div>
              </CardHeader>
              <CardContent>
                <div className="mb-2 h-3 w-full rounded bg-gray-200"></div>
                <div className="h-3 w-2/3 rounded bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Define filter options
  const filterOptions = [
    {
      id: "category",
      label: "Category",
      options: Array.from(
        new Set(integrationNodes.map((node) => node.category)),
      ).map((category) => ({
        id: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        value: category,
        getIsMatch: (node: IntegrationNode) => node.category === category,
      })),
    },
    {
      id: "integrationType",
      label: "Integration Type",
      options: Array.from(
        new Set(integrationNodes.map((node) => node.integrationType)),
      ).map((type) => ({
        id: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: type,
        getIsMatch: (node: IntegrationNode) => node.integrationType === type,
      })),
    },
    {
      id: "status",
      label: "Status",
      options: [
        {
          id: "active",
          label: "Active",
          value: "active",
          getIsMatch: (node: IntegrationNode) => !node.deprecated,
        },
        {
          id: "deprecated",
          label: "Deprecated",
          value: "deprecated",
          getIsMatch: (node: IntegrationNode) => !!node.deprecated,
        },
      ],
    },
  ];

  // Define sort options
  const sortOptions = [
    {
      id: "name",
      label: "Name",
      accessor: (node: IntegrationNode) => node.name,
    },
    {
      id: "category",
      label: "Category",
      accessor: (node: IntegrationNode) => node.category,
    },
    {
      id: "integrationType",
      label: "Integration Type",
      accessor: (node: IntegrationNode) => node.integrationType,
    },
    {
      id: "version",
      label: "Version",
      accessor: (node: IntegrationNode) => node.version,
    },
    {
      id: "updated",
      label: "Last Updated",
      accessor: (node: IntegrationNode) => new Date(node.updatedAt),
    },
  ];

  // Search predicate
  const searchPredicate = (node: IntegrationNode, searchValue: string) => {
    const searchLower = searchValue.toLowerCase();
    return (
      node.name.toLowerCase().includes(searchLower) ||
      node.identifier.toLowerCase().includes(searchLower) ||
      node.description.toLowerCase().includes(searchLower) ||
      node.category.toLowerCase().includes(searchLower) ||
      node.integrationType.toLowerCase().includes(searchLower) ||
      (node.tags?.some((tag) => tag.toLowerCase().includes(searchLower)))
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Integration Apps</h1>
        <p className="text-muted-foreground">
          Available integration node definitions that can be used in automation
          scenarios.
        </p>
      </div>

      <EntityList
        items={integrationNodes}
        renderItem={(node, viewMode) => (
          <IntegrationNodeCard node={node} viewMode={viewMode} />
        )}
        filterOptions={filterOptions}
        sortOptions={sortOptions}
        defaultViewMode="grid"
        defaultSort={{
          option: "name",
          direction: "asc",
        }}
        searchPlaceholder="Search integration apps..."
        searchPredicate={searchPredicate}
        emptyMessage="No integration apps found. Check your filters or search terms."
        gridClassName="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        listClassName="space-y-2"
        isLoading={false}
        showViewModeToggle={true}
        showSearch={true}
        showSort={true}
        showFilters={true}
      />
    </div>
  );
}
