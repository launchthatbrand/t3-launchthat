"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DataMappingBuilder from "@/components/integrations/transformations/DataMappingBuilder";
import {
  MappingItem,
  TransformationItem,
} from "@/components/integrations/transformations/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useConvexAuth } from "convex/react";

interface ApiMappingResponse {
  success: boolean;
  mapping?: {
    id: string;
    name: string;
    description?: string;
    sourceSchema: string;
    targetSchema: string;
    mappings: {
      sourceField: string;
      targetField: string;
      transformation?: {
        functionId: string;
        parameters: Record<string, unknown>;
      };
    }[];
  };
  error?: string;
}

interface ApiTransformationsResponse {
  success: boolean;
  transformations: TransformationItem[];
  error?: string;
}

export default function EditTransformationPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { toast } = useToast();
  const [mapping, setMapping] = useState<{
    id: string;
    name: string;
    description?: string;
    sourceSchema: string;
    targetSchema: string;
    mappings: MappingItem[];
  } | null>(null);
  const [transformations, setTransformations] = useState<TransformationItem[]>(
    [],
  );
  const [isLoadingData, setIsLoadingData] = useState(true);
  const mappingId = params.id as string;

  useEffect(() => {
    if (!mappingId) return;

    const loadData = async () => {
      try {
        setIsLoadingData(true);

        // Fetch transformations
        const transformationsResponse = await fetch(
          "/api/integrations/transformations/functions",
        );
        const transformationsData =
          (await transformationsResponse.json()) as ApiTransformationsResponse;

        if (!transformationsData.success) {
          throw new Error(
            transformationsData.error ??
              "Failed to load transformation functions",
          );
        }

        setTransformations(transformationsData.transformations);

        // Fetch mapping
        const mappingResponse = await fetch(
          `/api/integrations/transformations/mappings/${mappingId}`,
        );
        const mappingData =
          (await mappingResponse.json()) as ApiMappingResponse;

        if (!mappingData.success) {
          throw new Error(mappingData.error ?? "Failed to load mapping");
        }

        if (!mappingData.mapping) {
          throw new Error("Mapping not found");
        }

        // Convert API format to component format
        const convertedMappings: MappingItem[] =
          mappingData.mapping.mappings.map((m) => ({
            id: `${m.sourceField}_${m.targetField}`,
            sourceFieldId: m.sourceField,
            targetFieldId: m.targetField,
            transformationId: m.transformation?.functionId,
            parameters: m.transformation?.parameters,
          }));

        setMapping({
          id: mappingData.mapping.id,
          name: mappingData.mapping.name,
          description: mappingData.mapping.description,
          sourceSchema: mappingData.mapping.sourceSchema,
          targetSchema: mappingData.mapping.targetSchema,
          mappings: convertedMappings,
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to load data",
          variant: "destructive",
        });
        // Navigate back to list on error
        router.push("/integrations/transformations");
      } finally {
        setIsLoadingData(false);
      }
    };

    void loadData();
  }, [mappingId, router, toast]);

  // Auth check
  if (isLoading || isLoadingData) {
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

  if (!mapping) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-muted-foreground">
              Mapping not found or still loading...
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
          <CardTitle>Edit Data Mapping</CardTitle>
          <CardDescription>
            Modify an existing data mapping transformation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataMappingBuilder
            initialMapping={mapping}
            transformations={transformations}
          />
        </CardContent>
      </Card>
    </div>
  );
}
