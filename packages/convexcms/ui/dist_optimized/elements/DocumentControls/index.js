"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { Fragment, useEffect } from "react";
import { formatAdminURL } from "@convexcms/core/shared";
import { getTranslation } from "@convexcms/translations";
import { useFormInitializing, useFormProcessing } from "../../forms/Form/context.js";
import { useConfig } from "../../providers/Config/index.js";
import { useEditDepth } from "../../providers/EditDepth/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { formatDate } from "../../utilities/formatDocTitle/formatDateTitle.js";
import { Autosave } from "../Autosave/index.js";
import { Button } from "../Button/index.js";
import { CopyLocaleData } from "../CopyLocaleData/index.js";
import { DeleteDocument } from "../DeleteDocument/index.js";
import { DuplicateDocument } from "../DuplicateDocument/index.js";
import { Gutter } from "../Gutter/index.js";
import { Locked } from "../Locked/index.js";
import { Popup, PopupList } from "../Popup/index.js";
import { PreviewButton } from "../PreviewButton/index.js";
import { PublishButton } from "../PublishButton/index.js";
import { RenderCustomComponent } from "../RenderCustomComponent/index.js";
import { SaveButton } from "../SaveButton/index.js";
import { SaveDraftButton } from "../SaveDraftButton/index.js";
import { Status } from "../Status/index.js";
const baseClass = "doc-controls";
export const DocumentControls = props => {
  const {
    id,
    slug,
    customComponents: {
      PreviewButton: CustomPreviewButton,
      PublishButton: CustomPublishButton,
      SaveButton: CustomSaveButton,
      SaveDraftButton: CustomSaveDraftButton
    } = {},
    data,
    disableActions,
    disableCreate,
    hasSavePermission,
    isAccountView,
    isEditing,
    onDelete,
    onDrawerCreateNew,
    onDuplicate,
    onTakeOver,
    permissions,
    readOnlyForIncomingUser,
    redirectAfterDelete,
    redirectAfterDuplicate,
    user
  } = props;
  const {
    i18n,
    t
  } = useTranslation();
  const editDepth = useEditDepth();
  const {
    config,
    getEntityConfig
  } = useConfig();
  const collectionConfig = getEntityConfig({
    collectionSlug: slug
  });
  const globalConfig = getEntityConfig({
    globalSlug: slug
  });
  const {
    admin: {
      dateFormat
    },
    localization,
    routes: {
      admin: adminRoute
    }
  } = config;
  // Settings these in state to avoid hydration issues if there is a mismatch between the server and client
  const [updatedAt, setUpdatedAt] = React.useState("");
  const [createdAt, setCreatedAt] = React.useState("");
  const processing = useFormProcessing();
  const initializing = useFormInitializing();
  useEffect(() => {
    if (data?.updatedAt) {
      setUpdatedAt(formatDate({
        date: data.updatedAt,
        i18n,
        pattern: dateFormat
      }));
    }
    if (data?.createdAt) {
      setCreatedAt(formatDate({
        date: data.createdAt,
        i18n,
        pattern: dateFormat
      }));
    }
  }, [data, i18n, dateFormat]);
  const hasCreatePermission = permissions && "create" in permissions && permissions.create;
  const hasDeletePermission = permissions && "delete" in permissions && permissions.delete;
  const showDotMenu = Boolean(collectionConfig && id && !disableActions && (hasCreatePermission || hasDeletePermission));
  const unsavedDraftWithValidations = !id && collectionConfig?.versions?.drafts && collectionConfig.versions?.drafts.validate;
  const autosaveEnabled = collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave || globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave;
  const showCopyToLocale = localization && !collectionConfig?.admin?.disableCopyToLocale;
  return /*#__PURE__*/_jsxs(Gutter, {
    className: baseClass,
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__wrapper`,
      children: [/*#__PURE__*/_jsx("div", {
        className: `${baseClass}__content`,
        children: /*#__PURE__*/_jsxs("ul", {
          className: `${baseClass}__meta`,
          children: [collectionConfig && !isEditing && !isAccountView && /*#__PURE__*/_jsx("li", {
            className: `${baseClass}__list-item`,
            children: /*#__PURE__*/_jsx("p", {
              className: `${baseClass}__value`,
              children: i18n.t("general:creatingNewLabel", {
                label: getTranslation(collectionConfig?.labels?.singular ?? i18n.t("general:document"), i18n)
              })
            })
          }), user && readOnlyForIncomingUser && /*#__PURE__*/_jsx(Locked, {
            className: `${baseClass}__locked-controls`,
            user: user
          }), (collectionConfig?.versions?.drafts || globalConfig?.versions?.drafts) && /*#__PURE__*/_jsxs(Fragment, {
            children: [(globalConfig || collectionConfig && isEditing) && /*#__PURE__*/_jsx("li", {
              className: [`${baseClass}__status`, `${baseClass}__list-item`].filter(Boolean).join(" "),
              children: /*#__PURE__*/_jsx(Status, {})
            }), hasSavePermission && autosaveEnabled && !unsavedDraftWithValidations && /*#__PURE__*/_jsx("li", {
              className: `${baseClass}__list-item`,
              children: /*#__PURE__*/_jsx(Autosave, {
                collection: collectionConfig,
                global: globalConfig,
                id: id,
                publishedDocUpdatedAt: data?.createdAt
              })
            })]
          }), collectionConfig?.timestamps && (isEditing || isAccountView) && /*#__PURE__*/_jsxs(Fragment, {
            children: [/*#__PURE__*/_jsxs("li", {
              className: [`${baseClass}__list-item`, `${baseClass}__value-wrap`].filter(Boolean).join(" "),
              title: data?.updatedAt ? updatedAt : "",
              children: [/*#__PURE__*/_jsxs("p", {
                className: `${baseClass}__label`,
                children: [i18n.t("general:lastModified"), ": "]
              }), data?.updatedAt && /*#__PURE__*/_jsx("p", {
                className: `${baseClass}__value`,
                children: updatedAt
              })]
            }), /*#__PURE__*/_jsxs("li", {
              className: [`${baseClass}__list-item`, `${baseClass}__value-wrap`].filter(Boolean).join(" "),
              title: data?.createdAt ? createdAt : "",
              children: [/*#__PURE__*/_jsxs("p", {
                className: `${baseClass}__label`,
                children: [i18n.t("general:created"), ": "]
              }), data?.createdAt && /*#__PURE__*/_jsx("p", {
                className: `${baseClass}__value`,
                children: createdAt
              })]
            })]
          })]
        })
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__controls-wrapper`,
        children: [/*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__controls`,
          children: [(collectionConfig?.admin.preview || globalConfig?.admin.preview) && /*#__PURE__*/_jsx(RenderCustomComponent, {
            CustomComponent: CustomPreviewButton,
            Fallback: /*#__PURE__*/_jsx(PreviewButton, {})
          }), hasSavePermission && /*#__PURE__*/_jsx(Fragment, {
            children: collectionConfig?.versions?.drafts || globalConfig?.versions?.drafts ? /*#__PURE__*/_jsxs(Fragment, {
              children: [(unsavedDraftWithValidations || !autosaveEnabled) && /*#__PURE__*/_jsx(RenderCustomComponent, {
                CustomComponent: CustomSaveDraftButton,
                Fallback: /*#__PURE__*/_jsx(SaveDraftButton, {})
              }), /*#__PURE__*/_jsx(RenderCustomComponent, {
                CustomComponent: CustomPublishButton,
                Fallback: /*#__PURE__*/_jsx(PublishButton, {})
              })]
            }) : /*#__PURE__*/_jsx(RenderCustomComponent, {
              CustomComponent: CustomSaveButton,
              Fallback: /*#__PURE__*/_jsx(SaveButton, {})
            })
          }), user && readOnlyForIncomingUser && /*#__PURE__*/_jsx(Button, {
            buttonStyle: "secondary",
            id: "take-over",
            onClick: onTakeOver,
            size: "medium",
            type: "button",
            children: t("general:takeOver")
          })]
        }), showDotMenu && !readOnlyForIncomingUser && /*#__PURE__*/_jsx(Popup, {
          button: /*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__dots`,
            children: [/*#__PURE__*/_jsx("div", {}), /*#__PURE__*/_jsx("div", {}), /*#__PURE__*/_jsx("div", {})]
          }),
          className: `${baseClass}__popup`,
          disabled: initializing || processing,
          horizontalAlign: "right",
          size: "large",
          verticalAlign: "bottom",
          children: /*#__PURE__*/_jsxs(PopupList.ButtonGroup, {
            children: [showCopyToLocale && /*#__PURE__*/_jsx(CopyLocaleData, {}), hasCreatePermission && /*#__PURE__*/_jsxs(React.Fragment, {
              children: [!disableCreate && /*#__PURE__*/_jsx(Fragment, {
                children: editDepth > 1 ? /*#__PURE__*/_jsx(PopupList.Button, {
                  id: "action-create",
                  onClick: onDrawerCreateNew,
                  children: i18n.t("general:createNew")
                }) : /*#__PURE__*/_jsx(PopupList.Button, {
                  href: formatAdminURL({
                    adminRoute,
                    path: `/collections/${collectionConfig?.slug}/create`
                  }),
                  id: "action-create",
                  children: i18n.t("general:createNew")
                })
              }), collectionConfig.disableDuplicate !== true && isEditing && /*#__PURE__*/_jsx(DuplicateDocument, {
                id: id.toString(),
                onDuplicate: onDuplicate,
                redirectAfterDuplicate: redirectAfterDuplicate,
                singularLabel: collectionConfig?.labels?.singular,
                slug: collectionConfig?.slug
              })]
            }), hasDeletePermission && /*#__PURE__*/_jsx(DeleteDocument, {
              buttonId: "action-delete",
              collectionSlug: collectionConfig?.slug,
              id: id.toString(),
              onDelete: onDelete,
              redirectAfterDelete: redirectAfterDelete,
              singularLabel: collectionConfig?.labels?.singular,
              useAsTitle: collectionConfig?.admin?.useAsTitle
            })]
          })
        })]
      })]
    }), /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__divider`
    })]
  });
};
//# sourceMappingURL=index.js.map