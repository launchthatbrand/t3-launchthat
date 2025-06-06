"use client";

import { useState } from "react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { ChevronLeft, Edit, Loader2, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

import {
  useContentTypes,
  useCreateContentType,
  useInitCmsSystem,
  useUpdateEntryCounts,
} from "./_api/contentTypes";

// Mock data for content types
const contentTypes = [
  {
    id: "course",
    name: "Course",
    slug: "courses",
    description: "Educational courses and workshops",
    fieldCount: 12,
    entryCount: 24,
    isBuiltIn: true,
  },
  {
    id: "product",
    name: "Product",
    slug: "products",
    description: "Physical and digital products for sale",
    fieldCount: 15,
    entryCount: 47,
    isBuiltIn: true,
  },
  {
    id: "event",
    name: "Event",
    slug: "events",
    description: "Upcoming webinars, conferences and meetups",
    fieldCount: 10,
    entryCount: 8,
    isBuiltIn: false,
  },
  {
    id: "testimonial",
    name: "Testimonial",
    slug: "testimonials",
    description: "Customer reviews and feedback",
    fieldCount: 6,
    entryCount: 15,
    isBuiltIn: false,
  },
];

// Sample fields for a content type
const sampleFields = [
  {
    id: "1",
    name: "Title",
    type: "text",
    required: true,
    searchable: true,
    filterable: true,
    description: "The title of the content",
  },
  {
    id: "2",
    name: "Slug",
    type: "text",
    required: true,
    searchable: true,
    filterable: false,
    description: "URL-friendly version of the title",
  },
  {
    id: "3",
    name: "Description",
    type: "textarea",
    required: false,
    searchable: true,
    filterable: false,
    description: "Brief description of the content",
  },
  {
    id: "4",
    name: "Content",
    type: "rich-text",
    required: false,
    searchable: true,
    filterable: false,
    description: "Main content body",
  },
  {
    id: "5",
    name: "Featured Image",
    type: "image",
    required: false,
    searchable: false,
    filterable: false,
    description: "Primary image for the content",
  },
  {
    id: "6",
    name: "Categories",
    type: "multi-select",
    required: false,
    searchable: true,
    filterable: true,
    description: "Content categories",
  },
  {
    id: "7",
    name: "Published",
    type: "boolean",
    required: true,
    searchable: false,
    filterable: true,
    description: "Whether the content is published",
  },
  {
    id: "8",
    name: "Publication Date",
    type: "date",
    required: false,
    searchable: false,
    filterable: true,
    description: "When the content was or will be published",
  },
];

interface ContentType {
  _id: Id<"contentTypes">;
  _creationTime: number;
  name: string;
  slug: string;
  description?: string;
  fieldCount?: number;
  entryCount?: number;
  isBuiltIn: boolean;
  isPublic: boolean;
  createdAt: number;
  updatedAt?: number;
}

export default function ContentTypesSettingsPage() {
  const [activeTab, setActiveTab] = useState("types");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newContentType, setNewContentType] = useState({
    name: "",
    slug: "",
    description: "",
    isPublic: true,
    includeTimestamps: true,
    enableApi: true,
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const contentTypesQuery = useContentTypes();
  const createContentType = useCreateContentType();
  const initCmsSystem = useInitCmsSystem();
  const updateEntryCounts = useUpdateEntryCounts();

  const handleCreateContentType = async () => {
    try {
      setIsCreating(true);

      // Validate inputs
      if (!newContentType.name || !newContentType.slug) {
        toast("Name and slug are required fields", {
          description: "Validation Error failed",
        });
        return;
      }

      // Create the content type
      if (createContentType) {
        await createContentType({
          name: newContentType.name,
          slug: newContentType.slug,
          description: newContentType.description,
          isPublic: newContentType.isPublic,
          includeTimestamps: newContentType.includeTimestamps,
          enableApi: newContentType.enableApi,
        });

        // Reset form and close dialog
        setNewContentType({
          name: "",
          slug: "",
          description: "",
          isPublic: true,
          includeTimestamps: true,
          enableApi: true,
        });
        setIsCreating(false);

        toast(`${newContentType.name} has been created successfully`);
      }
    } catch (error) {
      console.error("Failed to create content type:", error);
      toast("Creation Failed", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
      setIsCreating(false);
    }
  };

  const handleInitializeCms = async () => {
    try {
      setIsInitializing(true);
      if (initCmsSystem) {
        await initCmsSystem();
        toast("Built-in content types have been created successfully");
      }
    } catch (error) {
      console.error("Failed to initialize CMS:", error);
      toast("Initialization Failed", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRefreshCounts = async () => {
    try {
      setIsRefreshing(true);
      const result = await updateEntryCounts();
      toast(`Updated entry counts for ${result.length} content types`);
    } catch (error) {
      console.error("Failed to refresh counts:", error);
      toast("Failed to refresh entry counts", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSlugChange = (value: string) => {
    // Generate slug from name (lowercase, replace spaces with hyphens)
    const slug = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    setNewContentType({
      ...newContentType,
      slug,
    });
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/settings">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Content Types</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Define and manage custom content types and their structure
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="types">Content Types</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="types">
          <div className="mb-4 flex justify-between">
            <h2 className="text-xl font-semibold">All Content Types</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefreshCounts}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>Refresh Counts</>
                )}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Content Type
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Create New Content Type</DialogTitle>
                    <DialogDescription>
                      Define a new content type for your site
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Blog Post"
                        value={newContentType.name}
                        onChange={(e) => {
                          setNewContentType({
                            ...newContentType,
                            name: e.target.value,
                          });
                          if (!newContentType.slug) {
                            handleSlugChange(e.target.value);
                          }
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        placeholder="e.g., blog-posts"
                        value={newContentType.slug}
                        onChange={(e) =>
                          setNewContentType({
                            ...newContentType,
                            slug: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Used in URLs and API endpoints. Use only lowercase
                        letters, numbers, and hyphens.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="What kind of content will this type contain?"
                        value={newContentType.description}
                        onChange={(e) =>
                          setNewContentType({
                            ...newContentType,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="api-enabled"
                        checked={newContentType.enableApi}
                        onCheckedChange={(checked) =>
                          setNewContentType({
                            ...newContentType,
                            enableApi: checked,
                          })
                        }
                      />
                      <Label htmlFor="api-enabled">Enable API Access</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="create-timestamps"
                        checked={newContentType.includeTimestamps}
                        onCheckedChange={(checked) =>
                          setNewContentType({
                            ...newContentType,
                            includeTimestamps: checked,
                          })
                        }
                      />
                      <Label htmlFor="create-timestamps">
                        Include Timestamps
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={handleCreateContentType}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>Create Content Type</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              {contentTypesQuery === undefined ? (
                <div className="flex h-40 w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {Array.isArray(contentTypesQuery) &&
                  contentTypesQuery.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-center">Fields</TableHead>
                          <TableHead className="text-center">Entries</TableHead>
                          <TableHead className="text-center">Type</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contentTypesQuery.map((type: ContentType) => (
                          <TableRow key={type._id}>
                            <TableCell className="font-medium">
                              {type.name}
                            </TableCell>
                            <TableCell>{type.slug}</TableCell>
                            <TableCell className="max-w-[250px] truncate">
                              {type.description ?? "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              {type.fieldCount ?? 0}
                            </TableCell>
                            <TableCell className="text-center">
                              {type.entryCount ?? 0}
                            </TableCell>
                            <TableCell className="text-center">
                              {type.isBuiltIn ? (
                                <Badge variant="secondary">Built-in</Badge>
                              ) : (
                                <Badge>Custom</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link
                                    href={`/admin/settings/content-types/${type._id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                                {!type.isBuiltIn && (
                                  <Button variant="ghost" size="icon">
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : Array.isArray(contentTypesQuery) &&
                    contentTypesQuery.length === 0 ? (
                    <div className="flex h-40 w-full flex-col items-center justify-center gap-2">
                      <p className="text-muted-foreground">
                        No content types found
                      </p>
                      <Button
                        onClick={() => handleInitializeCms()}
                        disabled={isInitializing}
                      >
                        {isInitializing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Initializing...
                          </>
                        ) : (
                          <>Initialize CMS</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex h-40 w-full flex-col items-center justify-center gap-2">
                      <p className="text-destructive">
                        Error loading content types
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => handleInitializeCms()}
                        disabled={isInitializing}
                      >
                        {isInitializing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Initializing...
                          </>
                        ) : (
                          <>Initialize CMS</>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields">
          <div className="mb-4 flex justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {selectedType
                  ? `Fields for ${contentTypes.find((t) => t.id === selectedType)?.name}`
                  : "Fields"}
              </h2>
              {!selectedType && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Select a content type to manage its fields
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {!selectedType && (
                <Select
                  value={selectedType ?? ""}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedType && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Field
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Field</DialogTitle>
                      <DialogDescription>
                        Define a new field for the{" "}
                        {contentTypes.find((t) => t.id === selectedType)?.name}{" "}
                        content type
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="field-name">Field Name</Label>
                        <Input
                          id="field-name"
                          placeholder="e.g., Author Name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="field-key">Field Key</Label>
                        <Input id="field-key" placeholder="e.g., authorName" />
                        <p className="text-xs text-muted-foreground">
                          Used in the API and code. Use camelCase.
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="field-type">Field Type</Label>
                        <Select defaultValue="text">
                          <SelectTrigger id="field-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="rich-text">Rich Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="time">Time</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="file">File</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="multi-select">
                              Multi-Select
                            </SelectItem>
                            <SelectItem value="relation">Relation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="field-description">Description</Label>
                        <Textarea
                          id="field-description"
                          placeholder="Explain what this field is for"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="field-required" />
                        <Label htmlFor="field-required">Required Field</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="field-searchable" />
                        <Label htmlFor="field-searchable">Searchable</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="field-filterable" />
                        <Label htmlFor="field-filterable">Filterable</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Field</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {selectedType ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Searchable</TableHead>
                      <TableHead>Filterable</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleFields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{field.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {field.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {field.type}
                        </TableCell>
                        <TableCell>
                          {field.required ? (
                            <Badge>Required</Badge>
                          ) : (
                            <Badge variant="outline">Optional</Badge>
                          )}
                        </TableCell>
                        <TableCell>{field.searchable ? "Yes" : "No"}</TableCell>
                        <TableCell>{field.filterable ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {field.name !== "Title" &&
                              field.name !== "Slug" && (
                                <Button variant="ghost" size="icon">
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="mb-4 text-muted-foreground">
                  Select a content type to manage its fields
                </p>
                <Select
                  value={selectedType ?? ""}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Content Templates</CardTitle>
              <CardDescription>
                Create and manage templates for content types
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <p className="mb-4 text-muted-foreground">
                Templates feature coming soon
              </p>
              <p className="text-sm text-muted-foreground">
                This feature will allow you to create reusable templates for
                content types.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
