"use client";

import React, { useEffect, useState } from "react";
import DataMappingBuilder from "@/components/integrations/transformations/DataMappingBuilder";
import { TransformationItem } from "@/components/integrations/transformations/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useConvexAuth } from "convex/react";

interface ApiTransformationsResponse {
  success: boolean;
  transformations: TransformationItem[];
  error?: string;
}

export default function CreateTransformationPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { toast } = useToast();
  const [transformations, setTransformations] = useState<TransformationItem[]>(
    [],
  );
  const [isLoadingTransformations, setIsLoadingTransformations] =
    useState(true);

  useEffect(() => {
    const fetchTransformations = async () => {
      try {
        setIsLoadingTransformations(true);
        const response = await fetch(
          "/api/integrations/transformations/functions",
        );
        const data = (await response.json()) as ApiTransformationsResponse;
        if (data.success) {
          setTransformations(data.transformations);
        } else {
          throw new Error(
            data.error ?? "Failed to load transformation functions",
          );
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to load transformation functions",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTransformations(false);
      }
    };

    void fetchTransformations();
  }, [toast]);

  // Auth check
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-800" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-muted-foreground">
              Please sign in to access this page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Create Data Mapping</CardTitle>
          <CardDescription>
            Create a new data mapping transformation between two schemas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTransformations ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-800" />
            </div>
          ) : (
            <DataMappingBuilder transformations={transformations} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
