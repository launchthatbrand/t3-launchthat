"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { getTranslation } from "@convexcms/translations";
import { useLoadingOverlay } from "../../elements/LoadingOverlay/index.js";
import { useFormProcessing } from "../../forms/Form/context.js";
import { useTranslation } from "../../providers/Translation/index.js";
const baseClass = "loading-overlay";
export const LoadingOverlay = ({
  animationDuration,
  loadingText,
  overlayType,
  show = true
}) => {
  const {
    t
  } = useTranslation();
  return /*#__PURE__*/_jsxs("div", {
    className: [baseClass, show ? `${baseClass}--entering` : `${baseClass}--exiting`, overlayType ? `${baseClass}--${overlayType}` : ""].filter(Boolean).join(" "),
    style: {
      animationDuration: animationDuration || "500ms"
    },
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__bars`,
      children: [/*#__PURE__*/_jsx("div", {
        className: `${baseClass}__bar`
      }), /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__bar`
      }), /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__bar`
      }), /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__bar`
      }), /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__bar`
      })]
    }), /*#__PURE__*/_jsx("span", {
      className: `${baseClass}__text`,
      children: loadingText || t("general:loading")
    })]
  });
};
export const LoadingOverlayToggle = ({
  name: key,
  type = "fullscreen",
  loadingText,
  show
}) => {
  const {
    toggleLoadingOverlay
  } = useLoadingOverlay();
  React.useEffect(() => {
    toggleLoadingOverlay({
      type,
      isLoading: show,
      key,
      loadingText: loadingText || undefined
    });
    return () => {
      toggleLoadingOverlay({
        type,
        isLoading: false,
        key
      });
    };
  }, [show, toggleLoadingOverlay, key, type, loadingText]);
  return null;
};
export const FormLoadingOverlayToggle = ({
  name,
  type = "fullscreen",
  action,
  formIsLoading = false,
  loadingSuffix
}) => {
  const isProcessing = useFormProcessing();
  const {
    i18n,
    t
  } = useTranslation();
  const labels = {
    create: t("general:creating"),
    loading: t("general:loading"),
    update: t("general:updating")
  };
  return /*#__PURE__*/_jsx(LoadingOverlayToggle, {
    loadingText: `${labels[action]} ${loadingSuffix ? getTranslation(loadingSuffix, i18n) : ""}`.trim(),
    name: name,
    show: formIsLoading || isProcessing,
    type: type
  });
};
//# sourceMappingURL=index.js.map