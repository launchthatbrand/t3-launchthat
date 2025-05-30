"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as qs from "qs-esm";
import { useAuth } from "../../providers/Auth/index.js";
import { requests } from "../../utilities/api.js";
import { formatDocTitle } from "../../utilities/formatDocTitle/index.js";
import { useConfig } from "../Config/index.js";
import { useLocale, useLocaleLoading } from "../Locale/index.js";
import { usePreferences } from "../Preferences/index.js";
import { useTranslation } from "../Translation/index.js";
import { UploadEditsProvider, useUploadEdits } from "../UploadEdits/index.js";
import { useGetDocPermissions } from "./useGetDocPermissions.js";
const Context = /*#__PURE__*/createContext({});
export const useDocumentInfo = () => use(Context);
const DocumentInfo = ({
  children,
  ...props
}) => {
  const {
    id,
    collectionSlug,
    currentEditor: currentEditorFromProps,
    docPermissions: docPermissionsFromProps,
    globalSlug,
    hasPublishedDoc: hasPublishedDocFromProps,
    hasPublishPermission: hasPublishPermissionFromProps,
    hasSavePermission: hasSavePermissionFromProps,
    initialData,
    initialState,
    isLocked: isLockedFromProps,
    lastUpdateTime: lastUpdateTimeFromProps,
    mostRecentVersionIsAutosaved: mostRecentVersionIsAutosavedFromProps,
    unpublishedVersionCount: unpublishedVersionCountFromProps,
    versionCount: versionCountFromProps
  } = props;
  const [docPermissions, setDocPermissions] = useState(docPermissionsFromProps);
  const [hasSavePermission, setHasSavePermission] = useState(hasSavePermissionFromProps);
  const [hasPublishPermission, setHasPublishPermission] = useState(hasPublishPermissionFromProps);
  const {
    permissions
  } = useAuth();
  const {
    config: {
      admin: {
        dateFormat
      },
      routes: {
        api
      },
      serverURL
    },
    getEntityConfig
  } = useConfig();
  const collectionConfig = getEntityConfig({
    collectionSlug
  });
  const globalConfig = getEntityConfig({
    globalSlug
  });
  const abortControllerRef = useRef(new AbortController());
  const docConfig = collectionConfig || globalConfig;
  const {
    i18n
  } = useTranslation();
  const {
    uploadEdits
  } = useUploadEdits();
  const [documentTitle, setDocumentTitle] = useState(() => formatDocTitle({
    collectionConfig,
    data: {
      ...(initialData || {}),
      id
    },
    dateFormat,
    fallback: id?.toString(),
    globalConfig,
    i18n
  }));
  const [mostRecentVersionIsAutosaved, setMostRecentVersionIsAutosaved] = useState(mostRecentVersionIsAutosavedFromProps);
  const [versionCount, setVersionCount] = useState(versionCountFromProps);
  const [hasPublishedDoc, setHasPublishedDoc] = useState(hasPublishedDocFromProps);
  const [unpublishedVersionCount, setUnpublishedVersionCount] = useState(unpublishedVersionCountFromProps);
  const [documentIsLocked, setDocumentIsLocked] = useState(isLockedFromProps);
  const [currentEditor, setCurrentEditor] = useState(currentEditorFromProps);
  const [lastUpdateTime, setLastUpdateTime] = useState(lastUpdateTimeFromProps);
  const [savedDocumentData, setSavedDocumentData] = useState(initialData);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const updateUploadStatus = useCallback(status => {
    setUploadStatus(status);
  }, []);
  const {
    getPreference,
    setPreference
  } = usePreferences();
  const {
    code: locale
  } = useLocale();
  const {
    localeIsLoading
  } = useLocaleLoading();
  const isInitializing = useMemo(() => initialState === undefined || initialData === undefined || localeIsLoading, [initialData, initialState, localeIsLoading]);
  const baseURL = `${serverURL}${api}`;
  let slug;
  let pluralType;
  let preferencesKey;
  if (globalSlug) {
    slug = globalSlug;
    pluralType = "globals";
    preferencesKey = `global-${slug}`;
  }
  if (collectionSlug) {
    slug = collectionSlug;
    pluralType = "collections";
    if (id) {
      preferencesKey = `collection-${slug}-${id}`;
    }
  }
  const unlockDocument = useCallback(async (docID, slug) => {
    try {
      const isGlobal = slug === globalSlug;
      const query = isGlobal ? `where[globalSlug][equals]=${slug}` : `where[document.value][equals]=${docID}&where[document.relationTo][equals]=${slug}`;
      const request = await requests.get(`${serverURL}${api}/payload-locked-documents?${query}`);
      const {
        docs
      } = await request.json();
      if (docs.length > 0) {
        const lockID = docs[0].id;
        await requests.delete(`${serverURL}${api}/payload-locked-documents/${lockID}`, {
          headers: {
            "Content-Type": "application/json"
          }
        });
        setDocumentIsLocked(false);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to unlock the document", error);
    }
  }, [serverURL, api, globalSlug]);
  const updateDocumentEditor = useCallback(async (docID, slug, user) => {
    try {
      const isGlobal = slug === globalSlug;
      const query = isGlobal ? `where[globalSlug][equals]=${slug}` : `where[document.value][equals]=${docID}&where[document.relationTo][equals]=${slug}`;
      // Check if the document is already locked
      const request = await requests.get(`${serverURL}${api}/payload-locked-documents?${query}`);
      const {
        docs
      } = await request.json();
      if (docs.length > 0) {
        const lockID = docs[0].id;
        const userData = typeof user === "object" ? {
          relationTo: user.collection,
          value: user.id
        } : {
          relationTo: "users",
          value: user
        };
        // Send a patch request to update the _lastEdited info
        await requests.patch(`${serverURL}${api}/payload-locked-documents/${lockID}`, {
          body: JSON.stringify({
            user: userData
          }),
          headers: {
            "Content-Type": "application/json"
          }
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to update the document editor", error);
    }
  }, [serverURL, api, globalSlug]);
  const getDocPermissions = useGetDocPermissions({
    id: id,
    api,
    collectionSlug,
    globalSlug,
    i18n,
    locale,
    permissions,
    serverURL,
    setDocPermissions,
    setHasPublishPermission,
    setHasSavePermission
  });
  const getDocPreferences = useCallback(() => {
    return getPreference(preferencesKey);
  }, [getPreference, preferencesKey]);
  const setDocFieldPreferences = useCallback(async (path, fieldPreferences) => {
    const allPreferences = await getDocPreferences();
    if (preferencesKey) {
      try {
        await setPreference(preferencesKey, {
          ...allPreferences,
          fields: {
            ...(allPreferences?.fields || {}),
            [path]: {
              ...allPreferences?.fields?.[path],
              ...fieldPreferences
            }
          }
        });
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
      }
    }
  }, [setPreference, preferencesKey, getDocPreferences]);
  const incrementVersionCount = useCallback(() => {
    const newCount = versionCount + 1;
    if (collectionConfig && collectionConfig.versions) {
      if (collectionConfig.versions.maxPerDoc > 0) {
        setVersionCount(Math.min(newCount, collectionConfig.versions.maxPerDoc));
      } else {
        setVersionCount(newCount);
      }
    } else if (globalConfig && globalConfig.versions) {
      if (globalConfig.versions.max > 0) {
        setVersionCount(Math.min(newCount, globalConfig.versions.max));
      } else {
        setVersionCount(newCount);
      }
    }
  }, [collectionConfig, globalConfig, versionCount]);
  const updateSavedDocumentData = React.useCallback(json => {
    setSavedDocumentData(json);
  }, []);
  useEffect(() => {
    setDocumentTitle(formatDocTitle({
      collectionConfig,
      data: {
        ...savedDocumentData,
        id
      },
      dateFormat,
      fallback: id?.toString(),
      globalConfig,
      i18n
    }));
  }, [collectionConfig, globalConfig, savedDocumentData, dateFormat, i18n, id]);
  // clean on unmount
  useEffect(() => {
    const re1 = abortControllerRef.current;
    return () => {
      if (re1) {
        try {
          re1.abort();
        } catch (_err) {
          // swallow error
        }
      }
    };
  }, []);
  const action = React.useMemo(() => {
    const docURL = `${baseURL}${pluralType === "globals" ? `/globals` : ""}/${slug}${id ? `/${id}` : ""}`;
    const params = {
      depth: 0,
      "fallback-locale": "null",
      locale,
      uploadEdits: uploadEdits || undefined
    };
    return `${docURL}${qs.stringify(params, {
      addQueryPrefix: true
    })}`;
  }, [baseURL, locale, pluralType, id, slug, uploadEdits]);
  const value = {
    ...props,
    action,
    currentEditor,
    docConfig,
    docPermissions,
    documentIsLocked,
    getDocPermissions,
    getDocPreferences,
    hasPublishedDoc,
    hasPublishPermission,
    hasSavePermission,
    incrementVersionCount,
    initialData,
    initialState,
    isInitializing,
    lastUpdateTime,
    mostRecentVersionIsAutosaved,
    preferencesKey,
    savedDocumentData,
    setCurrentEditor,
    setDocFieldPreferences,
    setDocumentIsLocked,
    setDocumentTitle,
    setHasPublishedDoc,
    setLastUpdateTime,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    setUploadStatus: updateUploadStatus,
    title: documentTitle,
    unlockDocument,
    unpublishedVersionCount,
    updateDocumentEditor,
    updateSavedDocumentData,
    uploadStatus,
    versionCount
  };
  return /*#__PURE__*/_jsx(Context, {
    value: value,
    children: children
  });
};
export const DocumentInfoProvider = props => {
  return /*#__PURE__*/_jsx(UploadEditsProvider, {
    children: /*#__PURE__*/_jsx(DocumentInfo, {
      ...props
    })
  });
};
//# sourceMappingURL=index.js.map