"use client";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { TabsContent } from "@acme/ui/tabs";

interface AboutContentProps {
  description: string;
  categoryTags?: string[];
  creationTime: number;
}

export function AboutContent({
  description,
  categoryTags,
  creationTime,
}: AboutContentProps) {
  return (
    <TabsContent value="" className="outline-none">
      <h2 className="text-xl font-semibold">About</h2>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            {description}
          </CardContent>
        </Card>

        {categoryTags && categoryTags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categoryTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pt-2 text-sm text-muted-foreground">
          Group created on {new Date(creationTime).toLocaleDateString()}
        </div>
      </div>
    </TabsContent>
  );
}
