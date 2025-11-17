# AdminSinglePostLayout

A reusable layout component for all admin post type edit screens that provides a consistent structure with dynamic tabs.

## Overview

The `AdminSinglePostLayout` component serves as a wrapper that standardizes the interface for editing any post type (topics, posts, products, etc.) in the admin panel. It provides:

- Consistent header with title, back button, and save functionality
- Dynamic tab system (Content, Media, Vimeo, SEO, Settings)
- Configurable sidebar
- Built-in loading states and form handling

## Basic Usage

```typescript
import { AdminSinglePostLayout } from "~/components/admin/AdminSinglePostLayout";

// Your form component
const YourPostForm = ({ onSave, formData }) => {
  // Your form implementation
  return <form>...</form>;
};

// Usage
<AdminSinglePostLayout
  postType="topic"
  FormComponent={YourPostForm}
  formProps={{ formData: yourData }}
  tabs={{ content: true, media: true }}
  onSave={handleSave}
/>
```

## Configuration

### Tab Configuration

Control which tabs are shown:

```typescript
tabs={{
  content: true,   // Always shown (your form component)
  media: true,     // Media upload tab
  vimeo: true,     // Vimeo integration tab
  seo: true,       // SEO settings tab
  settings: true,  // Additional settings tab
}}
```

### Media Tab Configuration

```typescript
mediaConfig={{
  enabled: true,
  maxFiles: 5,
  acceptedFileTypes: ["image/jpeg", "image/png", "image/webp"],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  images: currentImages,
  onImageAdded: (image) => handleImageAdded(image),
  onImageRemoved: (index) => handleImageRemoved(index),
  onImageUpdated: (index, updates) => handleImageUpdated(index, updates),
}}
```

### Vimeo Tab Configuration

```typescript
vimeoConfig={{
  enabled: true,
  currentUrl: vimeoUrl,
  onUrlChange: setVimeoUrl,
  placeholder: "Enter Vimeo video URL",
}}
```

### SEO Tab Configuration

```typescript
seoConfig={{
  enabled: true,
  slug: currentSlug,
  metaTitle: currentMetaTitle,
  metaDescription: currentMetaDescription,
  onSlugChange: handleSlugChange,
  onMetaTitleChange: handleMetaTitleChange,
  onMetaDescriptionChange: handleMetaDescriptionChange,
  urlPreview: "https://yoursite.com/posts/",
}}
```

### Custom Tabs

Add custom tabs for specific post types:

```typescript
customTabs={[
  {
    id: "custom",
    label: "Custom Settings",
    content: <YourCustomTabContent />,
    isEnabled: true,
  }
]}
```

## Form Component Requirements

Your form component should implement the `AdminPostFormProps` interface:

```typescript
interface AdminPostFormProps {
  onSave?: (data: unknown) => Promise<void> | void;
  isSubmitting?: boolean;
  formData?: unknown;
  [key: string]: unknown;
}

const YourForm: React.FC<AdminPostFormProps> = ({
  onSave,
  isSubmitting,
  formData,
}) => {
  // Your form implementation
};
```

## Media Upload Integration

### Option 1: Within Form Component

Include media upload directly in your form component for simpler use cases.

### Option 2: Separate Media Tab (Recommended)

Use the dedicated Media tab for better organization and consistency:

1. Enable the media tab: `tabs: { media: true }`
2. Configure mediaConfig with your upload handlers
3. The layout will handle the media upload interface

## Complete Example

```typescript
export const TopicEditPage = ({ topicId, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState([]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Save logic
      await saveTopic(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminSinglePostLayout
      postType="topic"
      postId={topicId}
      postTitle={initialData?.title}
      FormComponent={TopicForm}
      formProps={{
        formData: initialData,
        onSave: handleFormSave,
      }}
      tabs={{
        content: true,
        media: true,
        vimeo: true,
        seo: true,
        settings: true,
      }}
      mediaConfig={{
        enabled: true,
        images,
        onImageAdded: (image) => setImages(prev => [...prev, image]),
        onImageRemoved: (index) => setImages(prev => prev.filter((_, i) => i !== index)),
        onImageUpdated: (index, updates) => setImages(prev =>
          prev.map((img, i) => i === index ? { ...img, ...updates } : img)
        ),
      }}
      onSave={handleSave}
      isSubmitting={isSubmitting}
      backUrl="/admin/topics"
      sidebarContent={<TopicSidebar />}
    />
  );
};
```

## Migration from Existing Forms

To migrate existing forms to use AdminSinglePostLayout:

1. **Extract form content**: Move your form fields into a separate component
2. **Implement AdminPostFormProps**: Ensure your form component accepts the required props
3. **Configure tabs**: Decide which tabs to enable for your post type
4. **Move media upload**: If you have featured image upload, configure the media tab
5. **Update page component**: Replace your custom layout with AdminSinglePostLayout

## Best Practices

1. **Consistent form interface**: All form components should follow the same pattern
2. **Tab configuration per post type**: Different post types can have different tab configurations
3. **Media handling**: Use the dedicated media tab for featured images/media
4. **Settings tab**: Use for post-type-specific settings that don't fit in the main form
5. **Sidebar content**: Use for publish status, categories, and metadata

## Exports

The component also re-exports related types and components for convenience:

```typescript
export { FeaturedImagesUpload } from "...";
export type { ProductImage } from "...";
export type {
  AdminPostFormProps,
  AdminPostTab,
  MediaConfig,
  VimeoConfig,
  SEOConfig,
  SettingsConfig,
  AdminSinglePostLayoutProps,
};
```
