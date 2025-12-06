import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { DragEndEvent } from "@dnd-kit/core";
import type { SerializedEditorState } from "lexical";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import type { MediaItem } from "~/components/media/MediaLibrary";

export interface AttachmentEntry {
  mediaItemId: Id<"mediaItems">;
  url: string;
  title?: string;
  alt?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface AttachmentsContext {
  supportsAttachments: boolean;
  attachments: AttachmentEntry[];
  setAttachments: Dispatch<SetStateAction<AttachmentEntry[]>>;
  handleAttachmentSelect: (media: MediaItem) => void;
  handleAttachmentRemove: (mediaItemId: Id<"mediaItems">) => void;
  handleAttachmentsDragEnd: (event: DragEndEvent) => void;
  isDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export type CustomFieldValue = string | number | boolean | null;

export interface GeneralMetaBoxData {
  headerLabel: string;
  originalSlug: string;
  title: string;
  setTitle: (value: string) => void;
  slugValue: string;
  setSlugValue: (value: string) => void;
  slugPreviewUrl: string | null;
  supportsPostsTable: boolean;
  isPublished: boolean;
  setIsPublished: (value: boolean) => void;
  editorKey: string;
  derivedEditorState?: SerializedEditorState;
  setContent: (value: string) => void;
  organizationId?: Id<"organizations">;
  excerpt: string;
  setExcerpt: (value: string) => void;
}

export interface CustomFieldsMetaBoxData {
  postTypeFieldsLoading: boolean;
  unassignedFields: Doc<"postTypeFields">[];
  renderCustomFieldControl: (
    field: Doc<"postTypeFields">,
    options?: { idSuffix?: string },
  ) => ReactNode;
  postMetaMap: Record<string, string | number | boolean | null>;
  slug: string;
}

export interface SidebarActionsMetaBoxData {
  renderSaveButton: (options?: { fullWidth?: boolean }) => ReactNode;
  handleDuplicate: (event?: React.MouseEvent) => void;
  isDuplicating: boolean;
  isSaving: boolean;
  supportsPostsTable: boolean;
  puckEditorHref: string | null;
  isNewRecord: boolean;
}

export interface SidebarMetadataMetaBoxData {
  headerLabel: string;
  post: Doc<"posts"> | null | undefined;
  postType: Doc<"postTypes"> | null;
  isNewRecord: boolean;
}

export interface MetaBoxVisibilityConfig {
  showGeneralPanel?: boolean;
  showCustomFieldsPanel?: boolean;
  showSidebarActions?: boolean;
  showSidebarMetadata?: boolean;
}

export interface NormalizedMetaBox {
  id: string;
  title: string;
  description?: string | null;
  location: "main" | "sidebar";
  priority: number;
  fields: Doc<"postTypeFields">[];
  rendererKey?: string | null;
}

export interface ResolvedMetaBox {
  id: string;
  title: string;
  description?: string | null;
  location: "main" | "sidebar";
  priority: number;
  render: () => ReactNode;
}

export interface AdminMetaBoxContext {
  post: Doc<"posts"> | null | undefined;
  postType: Doc<"postTypes"> | null;
  slug: string;
  isNewRecord: boolean;
  organizationId?: Id<"organizations">;
  attachmentsContext?: AttachmentsContext;
  general?: GeneralMetaBoxData;
  customFields?: CustomFieldsMetaBoxData;
  sidebar?: {
    actions?: SidebarActionsMetaBoxData;
    metadata?: SidebarMetadataMetaBoxData;
  };
  visibility?: MetaBoxVisibilityConfig;
}
