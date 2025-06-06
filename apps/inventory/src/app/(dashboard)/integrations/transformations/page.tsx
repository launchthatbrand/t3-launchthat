"use client";

import React, { useEffect, useState } from "react";
import DataMappingBuilder from "@/components/integrations/transformations/DataMappingBuilder";
import TransformationsList from "@/components/integrations/transformations/TransformationsList";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/trpc/react";
import {
  ArrowLeftRight,
  Code,
  FileDown,
  FileUp,
  List,
  PlusCircle,
} from "lucide-react";

export default function TransformationsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"mappings" | "builder">(
    "mappings",
  );
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Check if the transformation system is initialized
  useEffect(() => {
    const checkInitialization = async () => {
      try {
        const response = await fetch("/api/integrations/transformations/init");
        const data = await response.json();
        setIsInitialized(data.initialized);
      } catch (error) {
        console.error("Error checking initialization status:", error);
        setIsInitialized(false);
      }
    };

    void checkInitialization();
  }, []);

  // Initialize the system
  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch("/api/integrations/transformations/init", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description:
            "Transformation system initialized successfully with sample data.",
        });
        setIsInitialized(true);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to initialize",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Render initialization screen if not initialized
  if (isInitialized === false) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Data Transformations</h1>
        <Card>
          <CardHeader>
            <CardTitle>Initialization Required</CardTitle>
            <CardDescription>
              The transformation system needs to be initialized before use.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Click the button below to initialize the transformation system
              with sample data schemas. This will set up the necessary database
              tables and seed some example mapping configurations.
            </p>
            <Button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="mt-2"
            >
              {isInitializing ? "Initializing..." : "Initialize System"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render loading state
  if (isInitialized === null) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Data Transformations</h1>
        <Card>
          <CardContent className="py-10">
            <div className="flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
            <p className="mt-4 text-center text-muted-foreground">
              Checking transformation system status...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Data Transformations</h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <FileUp className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setActiveTab("builder")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Mapping
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "mappings" | "builder")}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="mappings">
            <List className="mr-2 h-4 w-4" />
            Mappings
          </TabsTrigger>
          <TabsTrigger value="builder">
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Mapping Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mappings" className="space-y-4">
          <TransformationsList
            onSelect={() => setActiveTab("builder")}
            onCreateNew={() => setActiveTab("builder")}
          />
        </TabsContent>

        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <CardTitle>Data Mapping Builder</CardTitle>
              <CardDescription>
                Create and configure transformations between different data
                schemas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataMappingBuilder />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
