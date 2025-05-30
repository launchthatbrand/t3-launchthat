import type {
  PaginatedDocs,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  User,
} from "@convexcms/core";
import type { I18n } from "@convexcms/translations";

export type DefaultVersionsViewProps = {
  canAccessAdmin: boolean;
  collectionConfig?: SanitizedCollectionConfig;
  config: SanitizedConfig;
  data: Document;
  editURL: string;
  entityLabel: string;
  globalConfig?: SanitizedGlobalConfig;
  i18n: I18n;
  id: number | string;
  limit: number;
  user: User;
  versionsData: PaginatedDocs<Document>;
};
