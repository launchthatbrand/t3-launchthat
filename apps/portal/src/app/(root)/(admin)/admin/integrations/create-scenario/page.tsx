"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from "@acme/ui";

// Scenario form validation schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Scenario name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  sourceType: z.string().min(1, {
    message: "Source type is required.",
  }),
  sourceId: z.string().min(1, {
    message: "Source is required.",
  }),
  targetType: z.string().min(1, {
    message: "Target type is required.",
  }),
  targetId: z.string().min(1, {
    message: "Target is required.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateScenarioPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Extend available sources to include Vimeo. In production this would be fetched from Convex.
  const availableSources = [
    {
      type: "wordpress",
      connections: [{ id: "conn1", name: "Company Blog" }],
    },
    {
      type: "vimeo",
      connections: [{ id: "conn3", name: "Marketing Vimeo" }],
    },
    {
      type: "monday",
      connections: [{ id: "conn2", name: "Product Team" }],
    },
  ];

  const availableTargets = [
    {
      type: "convex",
      tables: [
        { id: "users", name: "Users" },
        { id: "posts", name: "Blog Posts" },
      ],
    },
  ];

  // Fields mapping data structure - this would be dynamic based on selected source and target
  const [fieldMappings, setFieldMappings] = useState([
    { id: "1", sourceField: "post_title", targetField: "title" },
    { id: "2", sourceField: "post_content", targetField: "content" },
    { id: "3", sourceField: "post_author", targetField: "authorId" },
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      sourceType: "wordpress",
      sourceId: "",
      targetType: "convex",
      targetId: "",
    },
  });

  const selectedSourceType = form.watch("sourceType");
  const selectedTargetType = form.watch("targetType");

  const sourceConnections =
    availableSources.find((source) => source.type === selectedSourceType)
      ?.connections || [];

  const targetOptions =
    availableTargets.find((target) => target.type === selectedTargetType)
      ?.tables || [];

  const handleAddMapping = () => {
    const newId = String(fieldMappings.length + 1);
    setFieldMappings([
      ...fieldMappings,
      { id: newId, sourceField: "", targetField: "" },
    ]);
  };

  const handleRemoveMapping = (id: string) => {
    setFieldMappings(fieldMappings.filter((mapping) => mapping.id !== id));
  };

  const handleUpdateMapping = (
    id: string,
    field: "sourceField" | "targetField",
    value: string,
  ) => {
    setFieldMappings(
      fieldMappings.map((mapping) =>
        mapping.id === id ? { ...mapping, [field]: value } : mapping,
      ),
    );
  };

  const handleSaveScenario = async (values: FormValues) => {
    setIsSaving(true);

    try {
      // Simulate API save with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // This would be replaced with actual Convex mutation to save scenario
      console.log("Scenario saved:", {
        ...values,
        fieldMappings,
      });

      // Redirect to integrations page
      router.push("/admin/integrations?tab=scenarios");
    } catch (error) {
      console.error("Failed to save scenario:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/integrations")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Integrations
        </Button>

        <h1 className="text-3xl font-bold">Create Integration Scenario</h1>
        <p className="text-muted-foreground">
          Define a data flow between systems
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSaveScenario)}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Scenario Details</CardTitle>
              <CardDescription>
                Basic information about this integration scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scenario Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Import WordPress Posts" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this scenario
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this scenario does"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Source</CardTitle>
                <CardDescription>Where to get data from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sourceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a source type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSources.map((source) => (
                            <SelectItem key={source.type} value={source.type}>
                              {source.type.charAt(0).toUpperCase() +
                                source.type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Connection</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a connection" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sourceConnections.map((connection) => (
                            <SelectItem
                              key={connection.id}
                              value={connection.id}
                            >
                              {connection.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a connection for the source system
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Target</CardTitle>
                <CardDescription>Where to send data to</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="targetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a target type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTargets.map((target) => (
                            <SelectItem key={target.type} value={target.type}>
                              {target.type.charAt(0).toUpperCase() +
                                target.type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Table</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a table" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {targetOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a target table to import data into
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Field Mappings</CardTitle>
              <CardDescription>
                Map fields from source to target
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fieldMappings.map((mapping) => (
                  <div key={mapping.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium">
                        Source Field
                      </label>
                      <Input
                        value={mapping.sourceField}
                        onChange={(e) =>
                          handleUpdateMapping(
                            mapping.id,
                            "sourceField",
                            e.target.value,
                          )
                        }
                        placeholder="Source field name"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium">
                        Target Field
                      </label>
                      <Input
                        value={mapping.targetField}
                        onChange={(e) =>
                          handleUpdateMapping(
                            mapping.id,
                            "targetField",
                            e.target.value,
                          )
                        }
                        placeholder="Target field name"
                      />
                    </div>
                    <div className="pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMapping(mapping.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMapping}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Field Mapping
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/integrations")}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Scenario
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
