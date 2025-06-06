import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Id } from "@/lib/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { api } from "@/lib/convex";
import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Form schema
const performanceSettingsSchema = z.object({
  preferredPageSize: z.number().min(10).max(500).optional(),
  maxConcurrentRequests: z.number().min(1).max(10).optional(),
  rateLimitThreshold: z.number().min(50).max(200).optional(),
  batchSizeOverride: z.number().min(5).max(200).optional(),
  optimizationStrategy: z.enum(["speed", "memory", "balanced"]).optional(),
});

type PerformanceSettingsFormValues = z.infer<typeof performanceSettingsSchema>;

interface PerformanceSettingsFormProps {
  integrationId: Id<"mondayIntegration">;
  integration: {
    preferredPageSize?: number;
    maxConcurrentRequests?: number;
    rateLimitThreshold?: number;
    batchSizeOverride?: number;
    optimizationStrategy?: string;
  };
  onSuccess?: () => void;
}

export function PerformanceSettingsForm({
  integrationId,
  integration,
  onSuccess,
}: PerformanceSettingsFormProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSettings = useMutation(
    api.monday.mutations.updateIntegrationPerformanceSettings,
  );

  // Setup form with default values from the integration
  const form = useForm<PerformanceSettingsFormValues>({
    resolver: zodResolver(performanceSettingsSchema),
    defaultValues: {
      preferredPageSize: integration.preferredPageSize || 100,
      maxConcurrentRequests: integration.maxConcurrentRequests || 5,
      rateLimitThreshold: integration.rateLimitThreshold || 90,
      batchSizeOverride: integration.batchSizeOverride || 50,
      optimizationStrategy:
        (integration.optimizationStrategy as "speed" | "memory" | "balanced") ||
        "balanced",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(values: PerformanceSettingsFormValues) {
    setIsSubmitting(true);

    try {
      await updateSettings({
        integrationId,
        ...values,
      });

      toast({
        title: "Performance settings updated",
        description:
          "Monday.com integration performance settings have been updated successfully.",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error updating settings",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mb-4 w-full">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Performance Optimization</CardTitle>
            <CardDescription>
              Configure settings to optimize performance for large datasets
            </CardDescription>
          </div>
          <Badge
            variant={
              integration.optimizationStrategy === "speed"
                ? "default"
                : integration.optimizationStrategy === "memory"
                  ? "outline"
                  : "secondary"
            }
          >
            {integration.optimizationStrategy || "Balanced"}
          </Badge>
        </div>
      </CardHeader>

      <Accordion
        type="single"
        collapsible
        value={isExpanded ? "item-1" : ""}
        onValueChange={(value) => setIsExpanded(value === "item-1")}
      >
        <AccordionItem value="item-1" className="border-0">
          <AccordionContent>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Optimization Strategy */}
                    <FormField
                      control={form.control}
                      name="optimizationStrategy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Optimization Strategy</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select optimization strategy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="speed">
                                Speed (Higher resource usage)
                              </SelectItem>
                              <SelectItem value="balanced">
                                Balanced (Recommended)
                              </SelectItem>
                              <SelectItem value="memory">
                                Memory (More efficient, slower)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose how to balance speed vs. resource usage
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Preferred Page Size */}
                    <FormField
                      control={form.control}
                      name="preferredPageSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Page Size</FormLabel>
                          <div className="flex items-center space-x-4">
                            <FormControl>
                              <Slider
                                min={10}
                                max={500}
                                step={10}
                                value={[field.value || 100]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <Input
                              type="number"
                              className="w-20"
                              min={10}
                              max={500}
                              value={field.value || 100}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 100)
                              }
                            />
                          </div>
                          <FormDescription>
                            Number of items to fetch per page (10-500)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Batch Size Override */}
                    <FormField
                      control={form.control}
                      name="batchSizeOverride"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Size</FormLabel>
                          <div className="flex items-center space-x-4">
                            <FormControl>
                              <Slider
                                min={5}
                                max={200}
                                step={5}
                                value={[field.value || 50]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <Input
                              type="number"
                              className="w-20"
                              min={5}
                              max={200}
                              value={field.value || 50}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 50)
                              }
                            />
                          </div>
                          <FormDescription>
                            Number of items to process in each batch (5-200)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Max Concurrent Requests */}
                    <FormField
                      control={form.control}
                      name="maxConcurrentRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Concurrent Requests</FormLabel>
                          <div className="flex items-center space-x-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value || 5]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <Input
                              type="number"
                              className="w-20"
                              min={1}
                              max={10}
                              value={field.value || 5}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 5)
                              }
                            />
                          </div>
                          <FormDescription>
                            Maximum number of concurrent API requests (1-10)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Rate Limit Threshold */}
                    <FormField
                      control={form.control}
                      name="rateLimitThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate Limit Threshold (%)</FormLabel>
                          <div className="flex items-center space-x-4">
                            <FormControl>
                              <Slider
                                min={50}
                                max={200}
                                step={5}
                                value={[field.value || 90]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <Input
                              type="number"
                              className="w-20"
                              min={50}
                              max={200}
                              value={field.value || 90}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 90)
                              }
                            />
                          </div>
                          <FormDescription>
                            Percentage of Monday.com rate limit to use (50-200%)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Performance Settings"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <CardFooter className="text-sm text-muted-foreground">
        <p>
          Performance settings affect how data is synchronized between
          Monday.com and your application.
        </p>
      </CardFooter>
    </Card>
  );
}
