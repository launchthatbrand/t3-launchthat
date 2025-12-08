"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

import type { ProductImage } from "../store/products/_components/FeaturedImagesUpload";
import { FeaturedImagesUpload } from "../store/products/_components/FeaturedImagesUpload";

type AdminPostContextValue = {
  activeTab: string;
  setActiveTab: (next: string) => void;
  isSubmitting: boolean;
  onSave?: () => Promise<void> | void;
};

const AdminPostContext = createContext<AdminPostContextValue | undefined>(
  undefined,
);

const useAdminPost = () => {
  const ctx = useContext(AdminPostContext);
  if (!ctx) {
    throw new Error("useAdminPost must be used within AdminSinglePost");
  }
  return ctx;
};

type AdminSinglePostProps = {
  children: ReactNode;
  defaultTab?: string;
  onSave?: () => Promise<void> | void;
  isSubmitting?: boolean;
  postType?: string;
  postTitle?: string;
  postId?: string;
  userId?: string;
  formData?: unknown;
};

const AdminSinglePost = ({
  children,
  defaultTab = "content",
  onSave,
  isSubmitting = false,
}: AdminSinglePostProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <AdminPostContext.Provider
      value={{ activeTab, setActiveTab, onSave, isSubmitting }}
    >
      {children}
    </AdminPostContext.Provider>
  );
};

type HeaderProps = {
  title?: string;
  subtitle?: string;
  backHref?: string;
  showSaveButton?: boolean;
  saveLabel?: string;
};

const AdminSinglePostHeader = ({
  title,
  subtitle,
  backHref,
  showSaveButton = true,
  saveLabel = "Save",
}: HeaderProps) => {
  const { isSubmitting, onSave } = useAdminPost();

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          asChild={Boolean(backHref)}
          onClick={() => {
            if (!backHref) {
              window.history.back();
            }
          }}
        >
          {backHref ? (
            <a href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </a>
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </>
          )}
        </Button>
        <div>
          {title && <h1 className="text-xl font-semibold">{title}</h1>}
          {subtitle && (
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          )}
        </div>
      </div>
      {showSaveButton && (
        <Button
          disabled={isSubmitting}
          onClick={async () => {
            if (onSave) {
              await onSave();
            }
          }}
        >
          {isSubmitting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {saveLabel}
            </>
          )}
        </Button>
      )}
    </div>
  );
};

type LayoutProps = {
  children: ReactNode;
  className?: string;
};

const AdminSinglePostLayout = ({ children, className = "" }: LayoutProps) => (
  <div className={`grid gap-6 md:grid-cols-4 ${className}`}>{children}</div>
);

const AdminSinglePostMain = ({ children }: LayoutProps) => (
  <Card className="md:col-span-3">
    <CardContent className="p-6">{children}</CardContent>
  </Card>
);

const AdminSinglePostSidebar = ({ children }: LayoutProps) => (
  <div className="flex flex-col gap-4">{children}</div>
);

const AdminSinglePostTabs = ({ children }: { children: ReactNode }) => {
  const { activeTab, setActiveTab } = useAdminPost();
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {children}
    </Tabs>
  );
};

const AdminSinglePostTabsList = ({ children }: { children: ReactNode }) => (
  <TabsList className="flex flex-wrap">{children}</TabsList>
);

const AdminSinglePostTabsTrigger = ({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) => <TabsTrigger value={value}>{children}</TabsTrigger>;

const AdminSinglePostTabsContent = ({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) => <TabsContent value={value}>{children}</TabsContent>;

type MediaTabContentProps = {
  images?: ProductImage[];
  onImageAdded?: (image: ProductImage) => void;
  onImageRemoved?: (index: number) => void;
  onImageUpdated?: (index: number, updates: Partial<ProductImage>) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
};

const MediaTabContent = ({
  images = [],
  onImageAdded,
  onImageRemoved,
  onImageUpdated,
  maxFiles = 5,
  acceptedFileTypes,
  maxFileSize,
}: MediaTabContentProps) => (
  <div className="space-y-4">
    <FeaturedImagesUpload
      images={images}
      onImageAdded={onImageAdded as (image: ProductImage) => void}
      onImageRemoved={onImageRemoved}
      onImageUpdated={onImageUpdated}
      maxFiles={maxFiles}
      acceptedFileTypes={acceptedFileTypes}
      maxFileSize={maxFileSize}
    />
  </div>
);

type SEOTabContentProps = {
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  onSlugChange?: (value: string) => void;
  onMetaTitleChange?: (value: string) => void;
  onMetaDescriptionChange?: (value: string) => void;
  urlPreview?: string;
};

const SEOTabContent = ({
  slug = "",
  metaTitle = "",
  metaDescription = "",
  onSlugChange,
  onMetaTitleChange,
  onMetaDescriptionChange,
  urlPreview = "https://example.com/",
}: SEOTabContentProps) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="seo-slug">URL Slug</Label>
      <Input
        id="seo-slug"
        value={slug}
        onChange={(event) => onSlugChange?.(event.target.value)}
        placeholder="product-slug"
      />
    </div>
    <div>
      <Label htmlFor="seo-title">Meta Title</Label>
      <Input
        id="seo-title"
        value={metaTitle}
        onChange={(event) => onMetaTitleChange?.(event.target.value)}
        placeholder="Title shown in search engines"
      />
    </div>
    <div>
      <Label htmlFor="seo-description">Meta Description</Label>
      <Textarea
        id="seo-description"
        value={metaDescription}
        onChange={(event) => onMetaDescriptionChange?.(event.target.value)}
        placeholder="Describe this page for search engines"
      />
    </div>
    <div className="rounded-md border p-4">
      <div className="text-blue-600">
        {metaTitle || "Store Page Title"} | LaunchThat
      </div>
      <div className="text-sm text-green-700">
        {urlPreview}
        {slug || "page-slug"}
      </div>
      <div className="text-muted-foreground mt-1 text-sm">
        {metaDescription ||
          "This description will appear in search results when customers discover your store page."}
      </div>
    </div>
  </div>
);

export {
  AdminSinglePost,
  AdminSinglePostHeader,
  AdminSinglePostLayout,
  AdminSinglePostMain,
  AdminSinglePostSidebar,
  AdminSinglePostTabs,
  AdminSinglePostTabsList,
  AdminSinglePostTabsTrigger,
  AdminSinglePostTabsContent,
  MediaTabContent,
  SEOTabContent,
};
