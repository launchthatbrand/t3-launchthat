"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Plus, Settings, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";
import { useMarketingTags } from "~/hooks/useMarketingTags";
import { useState } from "react";

interface CreateTagFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
  category: string;
}

export function MarketingTagsManager() {
  const { marketingTags, createTag } = useMarketingTags();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateTagFormData>({
    name: "",
    slug: "",
    description: "",
    color: "#3B82F6",
    category: "",
  });

  const handleCreateTag = async () => {
    try {
      await createTag({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        color: formData.color,
        category: formData.category || undefined,
        isActive: true,
      });

      toast.success("Marketing tag created successfully!");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        slug: "",
        description: "",
        color: "#3B82F6",
        category: "",
      });
    } catch (error) {
      toast.error(`Failed to create tag: ${error}`);
    }
  };

  const handleAssignTag = async () => {
    toast.info("Assigning tags is handled on CRM contacts; use the user/contact tag manager.");
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      name,
      slug,
    }));
  };

  if (marketingTags === undefined) {
    return <div>Loading marketing tags...</div>;
  }

  const categories = [
    ...new Set(
      marketingTags.filter((tag) => tag.category).map((tag) => tag.category),
    ),
  ];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Tags</h1>
          <p className="text-muted-foreground">
            Manage user segmentation and access control tags
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Marketing Tag</DialogTitle>
                <DialogDescription>
                  Create a new marketing tag for user segmentation and access
                  control.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Premium Member"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="premium-member"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Users with premium membership access"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    placeholder="membership"
                  />
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTag}
                  disabled={!formData.name || !formData.slug}
                >
                  Create Tag
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      {/* Tags Overview */}
      <div className="grid gap-6">
        {categories.length > 0
          ? categories.map((category) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {marketingTags
                      .filter((tag) => tag.category === category)
                      .map((tag) => (
                        <div
                          key={tag._id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <div>
                              <p className="font-medium">{tag.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {tag.slug}
                              </p>
                              {tag.description && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {tag.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={tag.isActive ? "default" : "secondary"}
                            >
                              {tag.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button size="sm" variant="ghost">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))
          : null}

        {/* Uncategorized Tags */}
        {marketingTags.filter((tag) => !tag.category).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Uncategorized
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {marketingTags
                  .filter((tag) => !tag.category)
                  .map((tag) => (
                    <div
                      key={tag._id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div>
                          <p className="font-medium">{tag.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tag.slug}
                          </p>
                          {tag.description && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {tag.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={tag.isActive ? "default" : "secondary"}>
                          {tag.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
