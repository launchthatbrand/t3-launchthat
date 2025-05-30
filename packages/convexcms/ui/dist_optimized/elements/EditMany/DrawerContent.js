"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import "../../forms/RenderFields/index.scss";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation.js";
import { mergeListSearchAndWhere, unflatten } from "@convexcms/core/shared";
import { getTranslation } from "@convexcms/translations";
import { useModal } from "@faceless-ui/modal";
import * as qs from "qs-esm";
import { useForm } from "../../forms/Form/context.js";
import { Form } from "../../forms/Form/index.js";
import { RenderField } from "../../forms/RenderFields/RenderField.js";
import { FormSubmit } from "../../forms/Submit/index.js";
import { XIcon } from "../../icons/X/index.js";
import { useAuth } from "../../providers/Auth/index.js";
import { useConfig } from "../../providers/Config/index.js";
import { DocumentInfoProvider } from "../../providers/DocumentInfo/index.js";
import { OperationContext } from "../../providers/Operation/index.js";
import { useRouteCache } from "../../providers/RouteCache/index.js";
import { SelectAllStatus, useSelection } from "../../providers/Selection/index.js";
import { useServerFunctions } from "../../providers/ServerFunctions/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { abortAndIgnore, handleAbortRef } from "../../utilities/abortAndIgnore.js";
import { parseSearchParams } from "../../utilities/parseSearchParams.js";
import { FieldSelect } from "../FieldSelect/index.js";
import { baseClass } from "./index.js";
const Submit = ({
  action,
  disabled
}) => {
  const {
    submit
  } = useForm();
  const {
    t
  } = useTranslation();
  const save = useCallback(() => {
    void submit({
      action,
      method: "PATCH",
      skipValidation: true
    });
  }, [action, submit]);
  return /*#__PURE__*/_jsx(FormSubmit, {
    className: `${baseClass}__save`,
    disabled: disabled,
    onClick: save,
    children: t("general:save")
  });
};
const PublishButton = ({
  action,
  disabled
}) => {
  const {
    submit
  } = useForm();
  const {
    t
  } = useTranslation();
  const save = useCallback(() => {
    void submit({
      action,
      method: "PATCH",
      overrides: {
        _status: "published"
      },
      skipValidation: true
    });
  }, [action, submit]);
  return /*#__PURE__*/_jsx(FormSubmit, {
    className: `${baseClass}__publish`,
    disabled: disabled,
    onClick: save,
    children: t("version:publishChanges")
  });
};
const SaveDraftButton = ({
  action,
  disabled
}) => {
  const {
    submit
  } = useForm();
  const {
    t
  } = useTranslation();
  const save = useCallback(() => {
    void submit({
      action,
      method: "PATCH",
      overrides: {
        _status: "draft"
      },
      skipValidation: true
    });
  }, [action, submit]);
  return /*#__PURE__*/_jsx(FormSubmit, {
    buttonStyle: "secondary",
    className: `${baseClass}__draft`,
    disabled: disabled,
    onClick: save,
    children: t("version:saveDraft")
  });
};
export const EditManyDrawerContent = props => {
  const {
    collection: {
      fields,
      labels: {
        plural,
        singular
      }
    } = {},
    collection,
    drawerSlug,
    selectedFields,
    setSelectedFields
  } = props;
  const {
    permissions,
    user
  } = useAuth();
  const {
    closeModal
  } = useModal();
  const {
    config: {
      routes: {
        api: apiRoute
      },
      serverURL
    }
  } = useConfig();
  const {
    getFormState
  } = useServerFunctions();
  const {
    count,
    getQueryParams,
    selectAll
  } = useSelection();
  const {
    i18n,
    t
  } = useTranslation();
  const [isInitializing, setIsInitializing] = useState(false);
  const router = useRouter();
  const abortFormStateRef = React.useRef(null);
  const {
    clearRouteCache
  } = useRouteCache();
  const collectionPermissions = permissions?.collections?.[collection.slug];
  const searchParams = useSearchParams();
  const select = useMemo(() => {
    return unflatten(selectedFields.reduce((acc, option) => {
      acc[option.value.path] = true;
      return acc;
    }, {}));
  }, [selectedFields]);
  const onChange = useCallback(async ({
    formState: prevFormState,
    submitted
  }) => {
    const controller = handleAbortRef(abortFormStateRef);
    const {
      state
    } = await getFormState({
      collectionSlug: collection.slug,
      docPermissions: collectionPermissions,
      docPreferences: null,
      formState: prevFormState,
      operation: "update",
      schemaPath: collection.slug,
      select,
      signal: controller.signal,
      skipValidation: !submitted
    });
    abortFormStateRef.current = null;
    return state;
  }, [getFormState, collection, collectionPermissions, select]);
  useEffect(() => {
    const abortFormState = abortFormStateRef.current;
    return () => {
      abortAndIgnore(abortFormState);
    };
  }, []);
  const queryString = useMemo(() => {
    const queryWithSearch = mergeListSearchAndWhere({
      collectionConfig: collection,
      search: searchParams.get("search")
    });
    return getQueryParams(queryWithSearch);
  }, [collection, searchParams, getQueryParams]);
  const onSuccess = () => {
    router.replace(qs.stringify({
      ...parseSearchParams(searchParams),
      page: selectAll === SelectAllStatus.AllAvailable ? "1" : undefined
    }, {
      addQueryPrefix: true
    }));
    clearRouteCache(); // Use clearRouteCache instead of router.refresh, as we only need to clear the cache if the user has route caching enabled - clearRouteCache checks for this
    closeModal(drawerSlug);
  };
  const onFieldSelect = useCallback(async ({
    dispatchFields,
    formState,
    selected
  }) => {
    setIsInitializing(true);
    setSelectedFields(selected || []);
    const {
      state
    } = await getFormState({
      collectionSlug: collection.slug,
      docPermissions: collectionPermissions,
      docPreferences: null,
      formState,
      operation: "update",
      schemaPath: collection.slug,
      select: unflatten(selected.reduce((acc, option) => {
        acc[option.value.path] = true;
        return acc;
      }, {})),
      skipValidation: true
    });
    dispatchFields({
      type: "UPDATE_MANY",
      formState: state
    });
    setIsInitializing(false);
  }, [getFormState, collection.slug, collectionPermissions, setSelectedFields]);
  return /*#__PURE__*/_jsx(DocumentInfoProvider, {
    collectionSlug: collection.slug,
    currentEditor: user,
    hasPublishedDoc: false,
    id: null,
    initialData: {},
    isLocked: false,
    lastUpdateTime: 0,
    mostRecentVersionIsAutosaved: false,
    unpublishedVersionCount: 0,
    versionCount: 0,
    children: /*#__PURE__*/_jsx(OperationContext, {
      value: "update",
      children: /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__main`,
        children: [/*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__header`,
          children: [/*#__PURE__*/_jsx("h2", {
            className: `${baseClass}__header__title`,
            children: t("general:editingLabel", {
              count,
              label: getTranslation(count > 1 ? plural : singular, i18n)
            })
          }), /*#__PURE__*/_jsx("button", {
            "aria-label": t("general:close"),
            className: `${baseClass}__header__close`,
            id: `close-drawer__${drawerSlug}`,
            onClick: () => closeModal(drawerSlug),
            type: "button",
            children: /*#__PURE__*/_jsx(XIcon, {})
          })]
        }), /*#__PURE__*/_jsxs(Form, {
          className: `${baseClass}__form`,
          isInitializing: isInitializing,
          onChange: [onChange],
          onSuccess: onSuccess,
          children: [/*#__PURE__*/_jsx(FieldSelect, {
            fields: fields,
            onChange: onFieldSelect,
            permissions: collectionPermissions.fields
          }), selectedFields.length === 0 ? null : /*#__PURE__*/_jsx("div", {
            className: "render-fields",
            children: selectedFields.map((option, i) => {
              const {
                value: {
                  field,
                  fieldPermissions,
                  path
                }
              } = option;
              return /*#__PURE__*/_jsx(RenderField, {
                clientFieldConfig: field,
                indexPath: "",
                parentPath: "",
                parentSchemaPath: "",
                path: path,
                permissions: fieldPermissions
              }, `${path}-${i}`);
            })
          }), /*#__PURE__*/_jsx("div", {
            className: `${baseClass}__sidebar-wrap`,
            children: /*#__PURE__*/_jsx("div", {
              className: `${baseClass}__sidebar`,
              children: /*#__PURE__*/_jsx("div", {
                className: `${baseClass}__sidebar-sticky-wrap`,
                children: /*#__PURE__*/_jsx("div", {
                  className: `${baseClass}__document-actions`,
                  children: collection?.versions?.drafts ? /*#__PURE__*/_jsxs(React.Fragment, {
                    children: [/*#__PURE__*/_jsx(SaveDraftButton, {
                      action: `${serverURL}${apiRoute}/${collection.slug}${queryString}&draft=true`,
                      disabled: selectedFields.length === 0
                    }), /*#__PURE__*/_jsx(PublishButton, {
                      action: `${serverURL}${apiRoute}/${collection.slug}${queryString}&draft=true`,
                      disabled: selectedFields.length === 0
                    })]
                  }) : /*#__PURE__*/_jsx(Submit, {
                    action: `${serverURL}${apiRoute}/${collection.slug}${queryString}`,
                    disabled: selectedFields.length === 0
                  })
                })
              })
            })
          })]
        })]
      })
    })
  });
};
//# sourceMappingURL=DrawerContent.js.map