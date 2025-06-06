"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Plus, Save, Trash } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  useAddField,
  useContentType,
  useRemoveField,
  useUpdateContentType,
  useUpdateField,
} from "../_api/contentTypes";

// Field types for dropdown
const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Text Area" },
  { value: "richText", label: "Rich Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Date & Time" },
  { value: "select", label: "Select" },
  { value: "multiSelect", label: "Multi Select" },
  { value: "file", label: "File" },
  { value: "image", label: "Image" },
  { value: "relation", label: "Relation" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "json", label: "JSON" },
];

export default function ContentTypeEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [contentTypeData, setContentTypeData] = useState({
    name: "",
    description: "",
    isPublic: true,
    enableApi: true,
    enableVersioning: false,
    includeTimestamps: true,
  });
  const [isAddingField, setIsAddingField] = useState(false);
  const [newField, setNewField] = useState({
    name: "",
    key: "",
    type: "text",
    description: "",
    required: false,
    searchable: false,
    filterable: false,
  });

  // Fetch content type data
  const contentTypeQuery = useContentType(id);
  const updateContentType = useUpdateContentType();
  const addField = useAddField();
  const updateField = useUpdateField();
  const removeField = useRemoveField();

  useEffect(() => {
    if (contentTypeQuery?.contentType) {
      const { contentType } = contentTypeQuery;
      setContentTypeData({
        name: contentType.name,
        description: contentType.description || "",
        isPublic: contentType.isPublic,
        enableApi: contentType.enableApi || true,
        enableVersioning: contentType.enableVersioning || false,
        includeTimestamps: contentType.includeTimestamps || true,
      });
    }
  }, [contentTypeQuery]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateContentType({
        id,
        name: contentTypeData.name,
        description: contentTypeData.description,
        isPublic: contentTypeData.isPublic,
        enableApi: contentTypeData.enableApi,
        enableVersioning: contentTypeData.enableVersioning,
        includeTimestamps: contentTypeData.includeTimestamps,
      });
      toast.success("Content type updated");
    } catch (error) {
      console.error("Failed to update content type:", error);
      toast.error("Update failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddField = async () => {
    try {
      setIsAddingField(true);

      // Validate field data
      if (!newField.name || !newField.key || !newField.type) {
        toast.error("Field requires name, key, and type");
        return;
      }

      // Add the field
      await addField({
        contentTypeId: id,
        field: newField,
      });

      // Reset the form
      setNewField({
        name: "",
        key: "",
        type: "text",
        description: "",
        required: false,
        searchable: false,
        filterable: false,
      });

      toast.success(`Field "${newField.name}" added successfully`);
    } catch (error) {
      console.error("Failed to add field:", error);
      toast.error("Failed to add field", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsAddingField(false);
    }
  };

  const handleFieldKeyChange = (value: string) => {
    // Convert to snake_case
    const key = value
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    setNewField({ ...newField, key });
  };

  const handleRemoveField = async (fieldId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this field? This cannot be undone.",
      )
    ) {
      try {
        await removeField({ id: fieldId });
        toast.success("Field removed successfully");
      } catch (error) {
        console.error("Failed to remove field:", error);
        toast.error("Failed to remove field", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  };

  if (!id) {
    return (
      <div className="container py-6">
        <div className="flex h-40 w-full items-center justify-center">
          <p className="text-destructive">Invalid content type ID</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/settings/content-types">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">
            {contentTypeQuery?.contentType?.name || "Content Type"}
          </h1>
          {contentTypeQuery?.contentType?.isBuiltIn && (
            <Badge variant="secondary">Built-in</Badge>
          )}
        </div>
        <p className="mt-2 text-muted-foreground">
          {contentTypeQuery?.contentType?.description ||
            "Manage content type settings and fields"}
        </p>
      </div>

      {contentTypeQuery === undefined ? (
        <div className="flex h-40 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : contentTypeQuery === null ? (
        <div className="flex h-40 w-full items-center justify-center">
          <p className="text-destructive">Content type not found</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="api">API & Integrations</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic information about this content type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={contentTypeData.name}
                    onChange={(e) =>
                      setContentTypeData({
                        ...contentTypeData,
                        name: e.target.value,
                      })
                    }
                    disabled={contentTypeQuery.contentType.isBuiltIn}
                  />
                  <p className="text-xs text-muted-foreground">
                    Display name for this content type
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={contentTypeData.description}
                    onChange={(e) =>
                      setContentTypeData({
                        ...contentTypeData,
                        description: e.target.value,
                      })
                    }
                    disabled={contentTypeQuery.contentType.isBuiltIn}
                  />
                  <p className="text-xs text-muted-foreground">
                    Helps users understand what this content type is for
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="public"
                    checked={contentTypeData.isPublic}
                    onCheckedChange={(checked) =>
                      setContentTypeData({
                        ...contentTypeData,
                        isPublic: checked,
                      })
                    }
                    disabled={contentTypeQuery.contentType.isBuiltIn}
                  />
                  <Label htmlFor="public">Publicly visible</Label>
                </div>
              </CardContent>
              <CardFooter className="justify-between border-t px-6 py-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Slug:{" "}
                    <span className="font-mono">
                      {contentTypeQuery.contentType.slug}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created:{" "}
                    {new Date(
                      contentTypeQuery.contentType.createdAt,
                    ).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || contentTypeQuery.contentType.isBuiltIn}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="fields">
            <div className="mb-4 flex justify-between">
              <h2 className="text-xl font-semibold">Fields</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Add New Field</DialogTitle>
                    <DialogDescription>
                      Define a new field for this content type
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="field-name">Field Name</Label>
                      <Input
                        id="field-name"
                        placeholder="e.g., Title"
                        value={newField.name}
                        onChange={(e) => {
                          setNewField({ ...newField, name: e.target.value });
                          if (!newField.key) {
                            handleFieldKeyChange(e.target.value);
                          }
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="field-key">Field Key</Label>
                      <Input
                        id="field-key"
                        placeholder="e.g., title"
                        value={newField.key}
                        onChange={(e) =>
                          setNewField({ ...newField, key: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Used in database and API. Use only lowercase letters,
                        numbers, and underscores.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="field-type">Field Type</Label>
                      <Select
                        value={newField.type}
                        onValueChange={(value) =>
                          setNewField({ ...newField, type: value })
                        }
                      >
                        <SelectTrigger id="field-type">
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="field-description">Description</Label>
                      <Textarea
                        id="field-description"
                        placeholder="What this field is used for"
                        value={newField.description}
                        onChange={(e) =>
                          setNewField({
                            ...newField,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="field-required"
                        checked={newField.required}
                        onCheckedChange={(checked) =>
                          setNewField({ ...newField, required: checked })
                        }
                      />
                      <Label htmlFor="field-required">Required</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="field-searchable"
                        checked={newField.searchable}
                        onCheckedChange={(checked) =>
                          setNewField({ ...newField, searchable: checked })
                        }
                      />
                      <Label htmlFor="field-searchable">Searchable</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="field-filterable"
                        checked={newField.filterable}
                        onCheckedChange={(checked) =>
                          setNewField({ ...newField, filterable: checked })
                        }
                      />
                      <Label htmlFor="field-filterable">Filterable</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={handleAddField}
                      disabled={isAddingField}
                    >
                      {isAddingField ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>Add Field</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-6">
                {contentTypeQuery.fields.length === 0 ? (
                  <div className="flex h-32 w-full flex-col items-center justify-center gap-2">
                    <p className="text-muted-foreground">
                      No fields defined yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add fields to define the structure of your content
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Required</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentTypeQuery.fields
                        .sort((a, b) => a.order - b.order)
                        .map((field) => (
                          <TableRow key={field._id}>
                            <TableCell className="font-medium">
                              {field.name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {field.key}
                            </TableCell>
                            <TableCell>{field.type}</TableCell>
                            <TableCell className="text-center">
                              {field.required ? "Yes" : "No"}
                            </TableCell>
                            <TableCell className="max-w-[250px] truncate">
                              {field.description || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {!field.isSystem && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveField(field._id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>
                  Configure API access for this content type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="enable-api"
                    checked={contentTypeData.enableApi}
                    onCheckedChange={(checked) =>
                      setContentTypeData({
                        ...contentTypeData,
                        enableApi: checked,
                      })
                    }
                    disabled={contentTypeQuery.contentType.isBuiltIn}
                  />
                  <Label htmlFor="enable-api">Enable API Access</Label>
                </div>
                <div className="rounded-md bg-muted p-4">
                  <h3 className="mb-2 text-sm font-medium">API Endpoints</h3>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span>GET</span>
                      <span className="text-muted-foreground">
                        /api/content/{contentTypeQuery.contentType.slug}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>GET</span>
                      <span className="text-muted-foreground">
                        /api/content/{contentTypeQuery.contentType.slug}/[id]
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>POST</span>
                      <span className="text-muted-foreground">
                        /api/content/{contentTypeQuery.contentType.slug}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || contentTypeQuery.contentType.isBuiltIn}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Configure advanced options for this content type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="include-timestamps"
                    checked={contentTypeData.includeTimestamps}
                    onCheckedChange={(checked) =>
                      setContentTypeData({
                        ...contentTypeData,
                        includeTimestamps: checked,
                      })
                    }
                    disabled={contentTypeQuery.contentType.isBuiltIn}
                  />
                  <Label htmlFor="include-timestamps">Include Timestamps</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="enable-versioning"
                    checked={contentTypeData.enableVersioning}
                    onCheckedChange={(checked) =>
                      setContentTypeData({
                        ...contentTypeData,
                        enableVersioning: checked,
                      })
                    }
                    disabled={contentTypeQuery.contentType.isBuiltIn}
                  />
                  <Label htmlFor="enable-versioning">Enable Versioning</Label>
                </div>

                {!contentTypeQuery.contentType.isBuiltIn && (
                  <div className="mt-8 rounded-md border border-destructive p-4">
                    <h3 className="text-sm font-medium text-destructive">
                      Danger Zone
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      These actions cannot be undone
                    </p>
                    <Button
                      variant="destructive"
                      className="mt-4"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure? This will permanently delete this content type and all its data.",
                          )
                        ) {
                          // TODO: Implement delete functionality
                          router.push("/admin/settings/content-types");
                        }
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Content Type
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || contentTypeQuery.contentType.isBuiltIn}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
