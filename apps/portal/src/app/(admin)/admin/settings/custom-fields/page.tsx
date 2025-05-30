"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Edit, Grip, Plus, Trash } from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
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

// Mock data for content types
const contentTypes = [
  { id: "courses", name: "Courses", fieldCount: 5 },
  { id: "products", name: "Products", fieldCount: 8 },
  { id: "events", name: "Events", fieldCount: 4 },
  { id: "posts", name: "Blog Posts", fieldCount: 3 },
];

// Mock data for custom fields
const customFields = [
  {
    id: "1",
    name: "Duration",
    key: "duration",
    type: "number",
    contentType: "courses",
    required: true,
    description: "Course duration in hours",
    order: 1,
  },
  {
    id: "2",
    name: "Difficulty Level",
    key: "difficulty_level",
    type: "select",
    contentType: "courses",
    required: true,
    options: ["Beginner", "Intermediate", "Advanced"],
    description: "Difficulty level of the course",
    order: 2,
  },
  {
    id: "3",
    name: "Prerequisites",
    key: "prerequisites",
    type: "text",
    contentType: "courses",
    required: false,
    description: "Required prerequisites for the course",
    order: 3,
  },
  {
    id: "4",
    name: "Skills Covered",
    key: "skills",
    type: "tags",
    contentType: "courses",
    required: false,
    description: "Skills that will be covered in the course",
    order: 4,
  },
  {
    id: "5",
    name: "Certification",
    key: "has_certification",
    type: "boolean",
    contentType: "courses",
    required: false,
    description: "Whether the course offers a certification",
    order: 5,
  },
  {
    id: "6",
    name: "Price",
    key: "price",
    type: "number",
    contentType: "products",
    required: true,
    description: "Product price",
    order: 1,
  },
  {
    id: "7",
    name: "SKU",
    key: "sku",
    type: "text",
    contentType: "products",
    required: true,
    description: "Stock Keeping Unit",
    order: 2,
  },
];

// Field type options
const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean (Yes/No)" },
  { value: "select", label: "Select (Dropdown)" },
  { value: "multi-select", label: "Multi-Select" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "color", label: "Color Picker" },
  { value: "image", label: "Image Upload" },
  { value: "file", label: "File Upload" },
  { value: "tags", label: "Tags" },
  { value: "rich-text", label: "Rich Text Editor" },
];

export default function CustomFieldsSettingsPage() {
  const [selectedContentType, setSelectedContentType] = useState<string | null>(
    null,
  );
  const [newFieldType, setNewFieldType] = useState<string>("text");
  const [showOptionsField, setShowOptionsField] = useState(false);

  // Get filtered fields for the selected content type
  const filteredFields = selectedContentType
    ? customFields.filter((field) => field.contentType === selectedContentType)
    : [];

  // Handle field type change
  const handleFieldTypeChange = (type: string) => {
    setNewFieldType(type);
    setShowOptionsField(type === "select" || type === "multi-select");
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
          <h1 className="text-3xl font-bold">Custom Fields</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Configure custom fields for different content types
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Content Types</CardTitle>
            <CardDescription>
              Select a content type to manage its fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contentTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={
                    selectedContentType === type.id ? "default" : "outline"
                  }
                  className="w-full justify-start"
                  onClick={() => setSelectedContentType(type.id)}
                >
                  {type.name}
                  <Badge className="ml-auto" variant="secondary">
                    {type.fieldCount}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          {selectedContentType ? (
            <>
              <div className="mb-4 flex justify-between">
                <h2 className="text-xl font-semibold">
                  {
                    contentTypes.find((type) => type.id === selectedContentType)
                      ?.name
                  }{" "}
                  Fields
                </h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Field
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>Add Custom Field</DialogTitle>
                      <DialogDescription>
                        Create a new custom field for{" "}
                        {
                          contentTypes.find(
                            (type) => type.id === selectedContentType,
                          )?.name
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="field-name">Field Name</Label>
                        <Input
                          id="field-name"
                          placeholder="e.g., Course Duration"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="field-key">Field Key</Label>
                        <Input
                          id="field-key"
                          placeholder="e.g., course_duration"
                        />
                        <p className="text-xs text-muted-foreground">
                          This is used in the database and API. Use only
                          lowercase letters, numbers, and underscores.
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="field-type">Field Type</Label>
                        <Select
                          defaultValue="text"
                          onValueChange={handleFieldTypeChange}
                        >
                          <SelectTrigger id="field-type">
                            <SelectValue placeholder="Select field type" />
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
                      {showOptionsField && (
                        <div className="grid gap-2">
                          <Label htmlFor="field-options">
                            Options (one per line)
                          </Label>
                          <Textarea
                            id="field-options"
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={3}
                          />
                        </div>
                      )}
                      <div className="grid gap-2">
                        <Label htmlFor="field-description">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="field-description"
                          placeholder="Help text to explain this field's purpose"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="field-required" />
                        <Label htmlFor="field-required">Required Field</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Field</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  {filteredFields.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Order</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Key</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="cursor-grab"
                              >
                                <Grip className="h-4 w-4" />
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">
                              {field.name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {field.key}
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
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <p className="mb-4 text-muted-foreground">
                        No custom fields defined for this content type yet
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Field
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          {/* Same dialog content as above */}
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="mb-4 text-muted-foreground">
                  Select a content type from the sidebar to manage its custom
                  fields
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
