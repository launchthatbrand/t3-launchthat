"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/trpc/react";
import { ArrowUpDown, MoreHorizontal, Plus, Search } from "lucide-react";

import { MappingConfiguration } from "./types";

export interface TransformationsListProps {
  onSelect?: (mapping: MappingConfiguration) => void;
  onCreateNew?: () => void;
}

export default function TransformationsList({
  onSelect,
  onCreateNew,
}: TransformationsListProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "updatedAt">("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fetch all mapping configurations
  const {
    data: mappings,
    isLoading,
    error,
    refetch,
  } = api.integrations.transformations.listMappingConfigurations.useQuery();

  // Delete a mapping configuration
  const deleteMutation =
    api.integrations.transformations.deleteMappingConfiguration.useMutation({
      onSuccess: () => {
        toast({
          title: "Mapping deleted",
          description: "The mapping configuration was deleted successfully.",
        });
        void refetch();
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: `Failed to delete mapping: ${err.message}`,
          variant: "destructive",
        });
      },
    });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this mapping?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSelect = (mapping: MappingConfiguration) => {
    if (onSelect) {
      onSelect(mapping);
    } else {
      router.push(`/integrations/transformations/edit/${mapping.id}`);
    }
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      router.push("/integrations/transformations/new");
    }
  };

  const toggleSort = (field: "name" | "updatedAt") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filter and sort mappings
  const filteredMappings = React.useMemo(() => {
    if (!mappings) return [];

    // Filter by search term
    let filtered = mappings.filter((mapping) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        mapping.name?.toLowerCase().includes(searchLower) ||
        mapping.description?.toLowerCase().includes(searchLower) ||
        mapping.sourceSchema.toLowerCase().includes(searchLower) ||
        mapping.targetSchema.toLowerCase().includes(searchLower)
      );
    });

    // Sort the filtered list
    filtered = [...filtered].sort((a, b) => {
      if (sortField === "name") {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return sortDirection === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else {
        // Sort by updatedAt
        const dateA = a.updatedAt || 0;
        const dateB = b.updatedAt || 0;
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
    });

    return filtered;
  }, [mappings, searchTerm, sortField, sortDirection]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load transformations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transformations..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Sort by
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleSort("name")}>
                Name{" "}
                {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("updatedAt")}>
                Last Updated{" "}
                {sortField === "updatedAt" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Mapping
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredMappings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="py-6 text-center">
              <p className="mb-4 text-muted-foreground">
                No transformation mappings found
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first mapping
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMappings.map((mapping) => (
            <Card
              key={mapping.id}
              className="transition-colors hover:border-primary/50"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleSelect(mapping)}
                    >
                      {mapping.name || "Unnamed Mapping"}
                    </CardTitle>
                    <CardDescription>
                      {mapping.sourceSchema} → {mapping.targetSchema}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSelect(mapping)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(
                            `/integrations/transformations/test/${mapping.id}`,
                          )
                        }
                      >
                        Test
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(mapping.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {mapping.description && (
                  <p className="text-sm text-muted-foreground">
                    {mapping.description}
                  </p>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  {mapping.mappings.length} field
                  {mapping.mappings.length !== 1 ? "s" : ""} mapped
                  {mapping.updatedAt && (
                    <>
                      {" "}
                      • Last updated{" "}
                      {new Date(mapping.updatedAt).toLocaleDateString()}
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelect(mapping)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
