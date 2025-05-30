import type {
  Data,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedDocumentPermissions,
  SanitizedGlobalConfig,
} from "@convexcms/core";
import {
  docAccessOperation,
  docAccessOperationGlobal,
  logError,
} from "@convexcms/core";
import {
  hasSavePermission as getHasSavePermission,
  isEditing as getIsEditing,
} from "@convexcms/ui/shared";

export const getDocumentPermissions = async (args: {
  collectionConfig?: SanitizedCollectionConfig;
  data: Data;
  globalConfig?: SanitizedGlobalConfig;
  id?: number | string;
  req: PayloadRequest;
}): Promise<{
  docPermissions: SanitizedDocumentPermissions;
  hasPublishPermission: boolean;
  hasSavePermission: boolean;
}> => {
  const { id, collectionConfig, data = {}, globalConfig, req } = args;

  let docPermissions: SanitizedDocumentPermissions;
  let hasPublishPermission = false;

  if (collectionConfig) {
    try {
      docPermissions = await docAccessOperation({
        id,
        collection: {
          config: collectionConfig,
        },
        req: {
          ...req,
          data: {
            ...data,
            _status: "draft",
          },
        },
      });

      if (collectionConfig.versions?.drafts) {
        hasPublishPermission = await docAccessOperation({
          id,
          collection: {
            config: collectionConfig,
          },
          req: {
            ...req,
            data: {
              ...data,
              _status: "published",
            },
          },
        }).then((permissions) => permissions.update);
      }
    } catch (err) {
      logError({ err, payload: req.payload });
    }
  }

  if (globalConfig) {
    try {
      docPermissions = await docAccessOperationGlobal({
        globalConfig,
        req: {
          ...req,
          data,
        },
      });

      if (globalConfig.versions?.drafts) {
        hasPublishPermission = await docAccessOperationGlobal({
          globalConfig,
          req: {
            ...req,
            data: {
              ...data,
              _status: "published",
            },
          },
        }).then((permissions) => permissions.update);
      }
    } catch (err) {
      logError({ err, payload: req.payload });
    }
  }

  const hasSavePermission = getHasSavePermission({
    collectionSlug: collectionConfig?.slug,
    docPermissions,
    globalSlug: globalConfig?.slug,
    isEditing: getIsEditing({
      id,
      collectionSlug: collectionConfig?.slug,
      globalSlug: globalConfig?.slug,
    }),
  });

  return {
    docPermissions,
    hasPublishPermission,
    hasSavePermission,
  };
};
