"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Check, Layout } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { getTemplatesByCategory } from "./groupTemplates";

interface TemplateDialogProps {
  onSelectTemplate: (templateId: string) => void;
}

export function TemplateDialog({ onSelectTemplate }: TemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const templatesByCategory = getTemplatesByCategory();
  const categories = Object.keys(templatesByCategory);
  const defaultCategory = categories.length > 0 ? categories[0] : "";

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Layout className="h-4 w-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Page Templates</DialogTitle>
          <DialogDescription>
            Choose a template to quickly create a pre-designed page layout.
          </DialogDescription>
        </DialogHeader>

        {categories.length > 0 ? (
          <div className="mt-4">
            <Tabs defaultValue={defaultCategory} className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-4">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent
                  key={category}
                  value={category}
                  className="border-none p-0 pt-4"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templatesByCategory[category]?.map((template) => (
                      <div
                        key={template.id}
                        className={cn(
                          "relative flex cursor-pointer flex-col overflow-hidden rounded-lg border p-2 transition-all hover:border-primary",
                          selectedTemplate === template.id
                            ? "border-2 border-primary"
                            : "border-border",
                        )}
                        onClick={() => handleSelectTemplate(template.id)}
                      >
                        {selectedTemplate === template.id && (
                          <div className="absolute right-2 top-2 h-5 w-5 rounded-full bg-primary">
                            <Check className="h-5 w-5 text-primary-foreground" />
                          </div>
                        )}
                        <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-md bg-muted">
                          {template.thumbnail ? (
                            <Image
                              src={template.thumbnail}
                              alt={template.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Layout className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 px-1">
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            No templates available.
          </div>
        )}

        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApplyTemplate} disabled={!selectedTemplate}>
            Apply Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
