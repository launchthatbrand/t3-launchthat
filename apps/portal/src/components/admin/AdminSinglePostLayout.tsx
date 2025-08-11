"use client";

import React, { createContext, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

import type { ProductImage } from "~/app/(root)/(admin)/admin/store/products/_components/FeaturedImagesUpload";
import type { HookContext } from "~/lib/hooks";
// Import and re-export the FeaturedImagesUpload component for convenience
import { FeaturedImagesUpload } from "~/app/(root)/(admin)/admin/store/products/_components/FeaturedImagesUpload";

export { FeaturedImagesUpload };
export type { ProductImage };

// Context for sharing state between components
interface AdminPostContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSubmitting: boolean;
  onSave?: () => Promise<void> | void;
  registerSaveHandler: (fn: () => Promise<void> | void) => void;
  postType: string;
  postTitle?: string;
  postId?: string;
  // Plugin context data
  pluginContext: HookContext;
}

const AdminPostContext = createContext<AdminPostContextValue | undefined>(
  undefined,
);

const useAdminPost = () => {
  const context = useContext(AdminPostContext);
  if (!context) {
    throw new Error("useAdminPost must be used within AdminSinglePost");
  }
  return context;
};

// Main container component
interface AdminSinglePostProps {
  children: React.ReactNode;
  postType: string;
  postTitle?: string;
  postId?: string;
  isSubmitting?: boolean;
  onSave?: () => Promise<void> | void;
  defaultTab?: string;
  userId?: string;
  formData?: unknown;
}

const AdminSinglePost = React.forwardRef<HTMLDivElement, AdminSinglePostProps>(
  (
    {
      children,
      postType,
      postTitle,
      postId,
      isSubmitting = false,
      onSave,
      defaultTab = "content",
      userId: _userId,
      formData,
    },
    ref,
  ) => {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const saveHandlerRef = useRef<(() => Promise<void> | void) | undefined>(
      onSave,
    );

    const contextValue: AdminPostContextValue = {
      activeTab,
      setActiveTab,
      isSubmitting,
      onSave: () => saveHandlerRef.current?.(),
      registerSaveHandler: (fn) => {
        saveHandlerRef.current = fn;
      },
      postType,
      postTitle,
      postId: postId ?? "",
      pluginContext: {
        postType,
        postId: postId ?? "",
        postTitle,
        isSubmitting,
        formData,
      },
    };

    return (
      <AdminPostContext.Provider value={contextValue}>
        <div ref={ref} className="w-full">
          {children}
        </div>
      </AdminPostContext.Provider>
    );
  },
);
AdminSinglePost.displayName = "AdminSinglePost";

// Header component
interface AdminSinglePostHeaderProps {
  children?: React.ReactNode;
  showBackButton?: boolean;
  backUrl?: string;
  showSaveButton?: boolean;
  saveButtonText?: string;
  className?: string;
}

const AdminSinglePostHeader = React.forwardRef<
  HTMLDivElement,
  AdminSinglePostHeaderProps
>(
  (
    {
      children,
      showBackButton = true,
      backUrl,
      showSaveButton = true,
      saveButtonText = "Save",
      className,
      ...props
    },
    ref,
  ) => {
    const router = useRouter();
    const { isSubmitting, onSave, postType, postTitle } = useAdminPost();

    const handleBack = () => {
      if (backUrl) {
        router.push(backUrl);
      } else {
        router.back();
      }
    };

    const handleSave = async () => {
      if (onSave) {
        await onSave();
      }
    };

    return (
      <div
        ref={ref}
        className={`mb-6 flex items-center justify-between bg-slate-300 ${className}`}
        {...props}
      >
        <div className="container flex flex-col items-start gap-4">
          {showBackButton && (
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          {children ?? (
            <div className="flex flex-col items-start gap-0">
              <h1 className="text-2xl font-bold">
                Edit {postType.charAt(0).toUpperCase() + postType.slice(1)}
              </h1>
              {postTitle && (
                <p className="text-muted-foreground">{postTitle}</p>
              )}
            </div>
          )}
        </div>

        {showSaveButton && (
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {saveButtonText}
              </>
            )}
          </Button>
        )}
      </div>
    );
  },
);
AdminSinglePostHeader.displayName = "AdminSinglePostHeader";

// Layout container
interface AdminSinglePostLayoutProps {
  children?: React.ReactNode;
  className?: string;
  // Legacy props for backward compatibility
  postType?: string;
  postId?: string;
  postTitle?: string;
  FormComponent?: React.ComponentType<unknown>;
  formProps?: unknown;
  tabs?: {
    content?: boolean;
    media?: boolean;
    seo?: boolean;
    vimeo?: boolean;
  };
  mediaConfig?: {
    enabled?: boolean;
    maxFiles?: number;
    acceptedFileTypes?: string[];
  };
  seoConfig?: unknown;
  isSubmitting?: boolean;
  onSave?: () => Promise<void> | void;
}

const AdminSinglePostLayout = React.forwardRef<
  HTMLDivElement,
  AdminSinglePostLayoutProps
>(
  (
    {
      children,
      className,
      // Extract and ignore legacy props to prevent them from being passed to DOM
      postType: _postType,
      postId: _postId,
      postTitle: _postTitle,
      FormComponent: _FormComponent,
      formProps: _formProps,
      tabs: _tabs,
      mediaConfig: _mediaConfig,
      isSubmitting: _isSubmitting,
      onSave: _onSave,
      seoConfig: _seoConfig,
      // Extract any other potential props to prevent DOM errors
      ..._restProps
    },
    ref,
  ) => {
    // For now, just render the layout. Later this can be enhanced to use the legacy props
    // to create the proper composable structure
    return (
      <div
        ref={ref}
        className={`grid gap-8 md:grid-cols-4 ${className ?? ""}`}
        // Don't spread restProps to prevent custom props from reaching DOM
      >
        {children}
      </div>
    );
  },
);
AdminSinglePostLayout.displayName = "AdminSinglePostLayout";

// Main content area
interface AdminSinglePostMainProps {
  children: React.ReactNode;
  className?: string;
}

const AdminSinglePostMain = React.forwardRef<
  HTMLDivElement,
  AdminSinglePostMainProps
>(({ children, className, ...props }, ref) => {
  return (
    <Card
      className={`border-none p-0 shadow-none md:col-span-3 ${className}`}
      ref={ref}
      {...props}
    >
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
});
AdminSinglePostMain.displayName = "AdminSinglePostMain";

// Sidebar area
interface AdminSinglePostSidebarProps {
  children: React.ReactNode;
  className?: string;
}

const AdminSinglePostSidebar = React.forwardRef<
  HTMLDivElement,
  AdminSinglePostSidebarProps
>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={`md:col-span-1 ${className}`} {...props}>
      {children}
    </div>
  );
});
AdminSinglePostSidebar.displayName = "AdminSinglePostSidebar";

// Tabs container
interface AdminSinglePostTabsProps {
  children: React.ReactNode;
  className?: string;
}

const AdminSinglePostTabs = React.forwardRef<
  HTMLDivElement,
  AdminSinglePostTabsProps
>(({ children, className, ...props }, ref) => {
  const { activeTab, setActiveTab } = useAdminPost();

  return (
    <Tabs
      ref={ref}
      value={activeTab}
      onValueChange={setActiveTab}
      className={`w-full ${className}`}
      {...props}
    >
      {children}
    </Tabs>
  );
});
AdminSinglePostTabs.displayName = "AdminSinglePostTabs";

// Tab List
interface AdminSinglePostTabsListProps {
  children: React.ReactNode;
  className?: string;
}

const AdminSinglePostTabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & AdminSinglePostTabsListProps
>(({ children, className, ...props }, ref) => {
  return (
    <TabsList ref={ref} className={`mb-2 ${className}`} {...props}>
      {children}
    </TabsList>
  );
});
AdminSinglePostTabsList.displayName = "AdminSinglePostTabsList";

// Tab Trigger
interface AdminSinglePostTabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const AdminSinglePostTabsTrigger = React.forwardRef<
  HTMLButtonElement,
  AdminSinglePostTabsTriggerProps
>(({ value, children, disabled, ...props }, ref) => {
  return (
    <TabsTrigger ref={ref} value={value} disabled={disabled} {...props}>
      {children}
    </TabsTrigger>
  );
});
AdminSinglePostTabsTrigger.displayName = "AdminSinglePostTabsTrigger";

// Tab Content
interface AdminSinglePostTabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const AdminSinglePostTabsContent = React.forwardRef<
  HTMLDivElement,
  AdminSinglePostTabsContentProps
>(({ value, children, className, ...props }, ref) => {
  return (
    <TabsContent
      ref={ref}
      value={value}
      className={`pt-4 ${className}`}
      {...props}
    >
      {children}
    </TabsContent>
  );
});
AdminSinglePostTabsContent.displayName = "AdminSinglePostTabsContent";

// Pre-built Media Tab Content
interface MediaTabContentProps {
  images?: ProductImage[];
  onImageAdded?: (image: ProductImage) => void;
  onImageRemoved?: (index: number) => void;
  onImageUpdated?: (index: number, updates: Partial<ProductImage>) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
}

const MediaTabContent = React.forwardRef<HTMLDivElement, MediaTabContentProps>(
  (
    {
      images = [],
      onImageAdded,
      onImageRemoved,
      onImageUpdated,
      maxFiles = 5,
      acceptedFileTypes,
      maxFileSize,
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className="grid gap-6" {...props}>
        <div>
          <h3 className="mb-4 text-lg font-medium">Featured Images</h3>
          <FeaturedImagesUpload
            images={images}
            onImageAdded={onImageAdded as (image: ProductImage) => void}
            onImageRemoved={onImageRemoved}
            onImageUpdated={
              onImageUpdated as (
                index: number,
                updates: Partial<ProductImage>,
              ) => void
            }
            maxFiles={maxFiles}
            acceptedFileTypes={acceptedFileTypes}
            maxFileSize={maxFileSize}
          />
        </div>
      </div>
    );
  },
);
MediaTabContent.displayName = "MediaTabContent";

// Pre-built Vimeo Tab Content
interface VimeoTabContentProps {
  currentUrl?: string;
  onUrlChange?: (url: string) => void;
  placeholder?: string;
}

const VimeoTabContent = React.forwardRef<HTMLDivElement, VimeoTabContentProps>(
  (
    {
      currentUrl = "",
      onUrlChange,
      placeholder = "Enter Vimeo video URL",
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className="grid gap-6" {...props}>
        <div>
          <Label htmlFor="vimeo-url">Vimeo URL</Label>
          <Input
            id="vimeo-url"
            placeholder={placeholder}
            value={currentUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onUrlChange?.(e.target.value);
            }}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Ensure this is a valid Vimeo share URL.
          </p>
        </div>
      </div>
    );
  },
);
VimeoTabContent.displayName = "VimeoTabContent";

// Pre-built SEO Tab Content
interface SEOTabContentProps {
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  onSlugChange?: (slug: string) => void;
  onMetaTitleChange?: (title: string) => void;
  onMetaDescriptionChange?: (description: string) => void;
  urlPreview?: string;
}

const SEOTabContent = React.forwardRef<HTMLDivElement, SEOTabContentProps>(
  (
    {
      slug = "",
      metaTitle = "",
      metaDescription = "",
      onSlugChange,
      onMetaTitleChange,
      onMetaDescriptionChange,
      urlPreview = "https://example.com/",
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className="grid gap-6" {...props}>
        <div>
          <Label htmlFor="seo-slug">URL Slug</Label>
          <Input
            id="seo-slug"
            placeholder="post-url-slug"
            value={slug}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onSlugChange?.(e.target.value);
            }}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            The URL-friendly version of the title
          </p>
        </div>

        <div>
          <Label htmlFor="meta-title">Meta Title</Label>
          <Input
            id="meta-title"
            placeholder="Page title for search engines"
            value={metaTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onMetaTitleChange?.(e.target.value);
            }}
          />
        </div>

        <div>
          <Label htmlFor="meta-description">Meta Description</Label>
          <Textarea
            id="meta-description"
            placeholder="Brief description for search engines"
            value={metaDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              onMetaDescriptionChange?.(e.target.value);
            }}
            className="min-h-[80px]"
          />
        </div>

        {/* SEO Preview */}
        <div className="grid gap-4">
          <h3 className="text-sm font-medium">SEO Preview</h3>
          <div className="rounded-md border p-4">
            <div className="text-blue-600 hover:underline">
              {metaTitle || "Page Title"}
            </div>
            <div className="text-sm text-green-700">
              {urlPreview}
              {slug || "page-slug"}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {metaDescription ||
                "This is where your page description will appear in search results..."}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
SEOTabContent.displayName = "SEOTabContent";

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
  VimeoTabContent,
  SEOTabContent,
  useAdminPost,
};

export default AdminSinglePost;
