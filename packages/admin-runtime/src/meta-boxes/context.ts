import type { ReactNode } from "react";

export interface MetaBoxVisibilityConfig {
  showGeneralPanel?: boolean;
  showCustomFieldsPanel?: boolean;
  showSidebarActions?: boolean;
  showSidebarMetadata?: boolean;
}

export interface AdminMetaBoxContext<
  TPost = unknown,
  TPostType = unknown,
  TOrganizationId = unknown,
  TAttachmentsContext = unknown,
  TGeneralMetaBoxData = unknown,
  TCustomFieldsMetaBoxData = unknown,
  TSidebarActionsMetaBoxData = unknown,
  TSidebarMetadataMetaBoxData = unknown,
> {
  post: TPost | null | undefined;
  postType: TPostType | null;
  slug: string;
  isNewRecord: boolean;
  organizationId?: TOrganizationId;
  attachmentsContext?: TAttachmentsContext;
  general?: TGeneralMetaBoxData;
  customFields?: TCustomFieldsMetaBoxData;
  sidebar?: {
    actions?: TSidebarActionsMetaBoxData;
    metadata?: TSidebarMetadataMetaBoxData;
  };
  visibility?: MetaBoxVisibilityConfig;
  registerBeforeSave?: (handler: () => Promise<void> | void) => () => void;
  registerMetaPayloadCollector?: (
    collector: () => Record<string, unknown> | null | undefined,
  ) => () => void;
  getMetaValue?: (key: string) => unknown;
  setMetaValue?: (key: string, value: unknown) => void;
  enqueueScript?: (node: ReactNode) => () => void;
  enqueueStyle?: (node: ReactNode) => () => void;
  // Allow hosts to tack on arbitrary values without losing type safety.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
