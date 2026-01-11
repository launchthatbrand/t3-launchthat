import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { DragEndEvent } from "@dnd-kit/core";
import type { SerializedEditorState } from "lexical";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import type {
  AdminMetaBoxContext as RuntimeAdminMetaBoxContext,
  MetaBoxLocation,
} from "@acme/admin-runtime";

import type { MediaItem } from "~/components/media/MediaLibrary";

export interface AttachmentEntry {
  mediaItemId: Id<"mediaItems">;
  url: string;
  previewImageUrl?: string;
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

export type CustomFieldSource = "schema" | "plugin" | "detected";

export type AdminPostStatus = string;

export interface PostStatusOption {
  value: string;
  label: string;
  description?: string;
}

export interface EditorCustomField
  extends Pick<
    Doc<"postTypeFields">,
    | "_id"
    | "key"
    | "name"
    | "description"
    | "type"
    | "required"
    | "options"
    | "defaultValue"
    | "isSystem"
    | "order"
  > {
  __source?: CustomFieldSource;
  __pluginName?: string;
  __readOnly?: boolean;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface GeneralMetaBoxData {
  headerLabel: string;
  originalSlug: string;
  title: string;
  setTitle: (value: string) => void;
  isTitleEditable: boolean;
  slugValue: string;
  setSlugValue: (value: string) => void;
  slugPreviewUrl: string | null;
  supportsSlugEditing: boolean;
  isSlugEditable: boolean;
  editorKey: string;
  derivedEditorState?: SerializedEditorState;
  setContent: (value: string) => void;
  organizationId?: Id<"organizations">;
  excerpt: string;
  setExcerpt: (value: string) => void;
}

export interface CustomFieldsMetaBoxData {
  postTypeFieldsLoading: boolean;
  unassignedFields: EditorCustomField[];
  renderCustomFieldControl: (
    field: EditorCustomField,
    options?: { idSuffix?: string },
  ) => ReactNode;
  renderFieldBlock: (
    field: EditorCustomField,
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
  canDuplicateRecord: boolean;
  canSaveRecord: boolean;
  puckEditorHref: string | null;
  isNewRecord: boolean;
  postStatus: AdminPostStatus;
  setPostStatus: (status: AdminPostStatus) => void;
  statusOptions: PostStatusOption[];
}

export interface SidebarMetadataMetaBoxData {
  headerLabel: string;
  post: Doc<"posts"> | null | undefined;
  postType: Doc<"postTypes"> | null;
  isNewRecord: boolean;
}

export interface NormalizedMetaBox {
  id: string;
  title: string;
  description?: string | null;
  location: MetaBoxLocation;
  priority: number;
  fields: EditorCustomField[];
  rendererKey?: string | null;
}

export interface ResolvedMetaBox {
  id: string;
  title: string;
  description?: string | null;
  location: MetaBoxLocation;
  priority: number;
  render: () => ReactNode;
}

export type AdminMetaBoxContext = RuntimeAdminMetaBoxContext<
  Doc<"posts">,
  Doc<"postTypes">,
  Id<"organizations">,
  AttachmentsContext,
  GeneralMetaBoxData,
  CustomFieldsMetaBoxData,
  SidebarActionsMetaBoxData,
  SidebarMetadataMetaBoxData
>;

export type { MetaBoxVisibilityConfig } from "@acme/admin-runtime";
