"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ChevronLeft, Save, Upload } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Progress } from "@acme/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

interface UploadFormValues {
  title: string;
  description: string;
  categoryId?: Id<"downloadCategories"> | "__none__";
  isPublic: boolean;
  file?: string;
}

interface UploadResponseData {
  storageId: Id<"_storage">;
}

interface Category {
  _id: Id<"downloadCategories">;
  name: string;
  description?: string;
  isPublic?: boolean;
  _creationTime?: number;
  createdAt?: number;
}

// Define a more specific type for what useQuery might return for categories
// This depends on the actual return type of api.downloadsLibrary.getDownloadCategories
// Assuming it returns Category[] on success, or undefined while loading.
// And Convex might wrap errors in a specific way or throw them.
type CategoriesQueryReturnType = Category[] | undefined;

export default function CreateDownloadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<Error | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const ensureUser = useMutation(api.core.users.mutations.createOrGetUser);

  // useQuery will return `undefined` while loading.
  // If the query throws an error server-side, useQuery might re-throw it client-side or return undefined.
  const categoriesDataFromQuery: CategoriesQueryReturnType = useQuery(
    api.downloadsLibrary.getDownloadCategories,
    {
      includePrivate: true,
    },
  );

  const categories: Category[] | undefined = categoriesDataFromQuery;
  const categoriesLoading =
    categoriesDataFromQuery === undefined &&
    !authLoading &&
    isAuthenticated &&
    !categoriesError;

  useEffect(() => {
    if (!authLoading) {
      setPageIsLoading(false);
      if (!isAuthenticated) {
        toast.error("You must be logged in to access this page");
        router.push("/login");
        return;
      }
      ensureUser().catch((error) => {
        console.error("Failed to ensure user exists:", error);
        // Potentially set an error state here if this is critical
      });
    }
  }, [authLoading, isAuthenticated, router, ensureUser]);

  // This useEffect is tricky because useQuery itself doesn't typically return an { error: ... } object.
  // It either returns data, undefined (while loading), or throws an error that should be caught by an ErrorBoundary.
  // If we want to catch errors from the query and put them in `categoriesError` state:
  // One approach is to wrap the useQuery call in a try/catch if it's known to throw catchable errors directly,
  // or rely on an ErrorBoundary higher up the component tree.
  // For now, this effect will primarily handle the `undefined` case after loading if data is still missing.
  useEffect(() => {
    if (
      categoriesDataFromQuery === undefined &&
      !authLoading &&
      isAuthenticated &&
      !categoriesLoading
    ) {
      // This state might indicate that data is still undefined after it should have loaded,
      // implying a potential issue if no error was thrown and caught by an ErrorBoundary.
      setCategoriesError(
        new Error(
          "Failed to load categories. Data remained undefined after loading period.",
        ),
      );
    }
    // If categoriesDataFromQuery could return an object like { error: { message: string } }, that would be handled here.
    // else if (categoriesDataFromQuery && typeof categoriesDataFromQuery === 'object' && 'error' in categoriesDataFromQuery) { ... }
  }, [
    categoriesDataFromQuery,
    authLoading,
    isAuthenticated,
    categoriesLoading,
  ]);

  const generateUploadUrl = useMutation(api.downloads.generateUploadUrl);
  const createFileDownload = useMutation(api.downloads.createFileDownload);

  const form = useForm<UploadFormValues>({
    defaultValues: {
      title: "",
      description: "",
      categoryId: undefined, // Start with undefined, not "__none__"
      isPublic: true,
      file: undefined,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        setFile(selectedFile);
        if (!form.getValues("title")) {
          const fileNameWithoutExtension = selectedFile.name
            .split(".")
            .slice(0, -1)
            .join(".");
          form.setValue("title", fileNameWithoutExtension || selectedFile.name);
        }
      }
    } else {
      setFile(null);
    }
  };

  const onSubmit = async (values: UploadFormValues) => {
    if (!file) {
      setFileError("Please select a file to upload");
      return;
    }
    try {
      setIsUploading(true);
      setUploadProgress(10);
      const postUrl = await generateUploadUrl({ filename: file.name });
      if (!postUrl) {
        throw new Error("Failed to get upload URL");
      }
      setUploadProgress(30);
      const uploadResponse = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error(
          `Upload failed: ${uploadResponse.status} - ${await uploadResponse.text()}`,
        );
      }

      const responseData = (await uploadResponse.json()) as UploadResponseData;

      if (typeof responseData.storageId !== "string") {
        throw new Error(
          "Invalid response from file upload: storageId not found or not a string.",
        );
      }
      const storageId = responseData.storageId;
      setUploadProgress(70);
      await createFileDownload({
        storageId: storageId,
        title: values.title,
        description: values.description,
        categoryId:
          values.categoryId && values.categoryId !== "__none__"
            ? values.categoryId
            : undefined,
        isPublic: values.isPublic,
      });
      setUploadProgress(100);
      toast.success("File uploaded successfully");
      router.push("/admin/downloads");
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload file";
      toast.error(errorMessage);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (pageIsLoading || authLoading) {
    return (
      <div className="container py-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (categoriesError && !categoriesLoading) {
    return (
      <div className="container py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/downloads">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Upload New File</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Add a new downloadable file to your library
          </p>
        </div>

        <Card className="mb-6 border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              There was an error loading the categories:{" "}
              {categoriesError.message}
            </p>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => router.refresh()} variant="outline">
                Refresh Page
              </Button>
              <Button onClick={() => router.push("/login")} variant="secondary">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/downloads">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Upload New File</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Add a new downloadable file to your library
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Details</CardTitle>
          <CardDescription>
            Provide information about the file you're uploading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="file"
                  render={() => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <Input
                          id="file"
                          type="file"
                          onChange={handleFileChange}
                          disabled={isUploading}
                          className={fileError ? "border-destructive" : ""}
                        />
                      </FormControl>
                      {file && (
                        <FormDescription>
                          Selected: {file.name} ({(file.size / 1024).toFixed(2)}{" "}
                          KB)
                        </FormDescription>
                      )}
                      {!file && !fileError && (
                        <FormDescription>
                          Select a file to upload
                        </FormDescription>
                      )}
                      {fileError && (
                        <p className="text-sm font-medium text-destructive">
                          {fileError}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter title"
                          {...field}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormDescription>
                        A descriptive title for the file
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter description"
                          className="min-h-[120px]"
                          {...field}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide details about the file and its contents
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? undefined}
                        disabled={isUploading || categoriesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {categoriesLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading categories...
                            </SelectItem>
                          ) : (
                            categories?.map((category: Category) => (
                              <SelectItem
                                key={category._id}
                                value={category._id}
                              >
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                          {categoriesError && !categoriesLoading && (
                            <SelectItem value="error" disabled>
                              Error loading categories.
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Categorize the file for easier organization
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Public Download</FormLabel>
                        <FormDescription>
                          If checked, this file will be available to all users
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-center text-sm text-muted-foreground">
                      {uploadProgress < 100
                        ? `Uploading ${uploadProgress}%`
                        : "Upload complete!"}
                    </p>
                  </div>
                )}
              </div>

              <CardFooter className="flex justify-end px-0 pb-0">
                <Button
                  type="button"
                  variant="outline"
                  className="mr-2"
                  onClick={() => router.back()}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading || !file}>
                  {isUploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-pulse" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Upload File
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
