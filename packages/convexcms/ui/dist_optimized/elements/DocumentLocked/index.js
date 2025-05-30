"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useEffect } from "react";
import { useRouteTransition } from "../../providers/RouteTransition/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { isClientUserObject } from "../../utilities/isClientUserObject.js";
import { Button } from "../Button/index.js";
import { Modal, useModal } from "../Modal/index.js";
const modalSlug = "document-locked";
const baseClass = "document-locked";
const formatDate = date => {
  if (!date) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    hour12: true,
    minute: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
};
export const DocumentLocked = ({
  handleGoBack,
  isActive,
  onReadOnly,
  onTakeOver,
  updatedAt,
  user
}) => {
  const {
    closeModal,
    openModal
  } = useModal();
  const {
    t
  } = useTranslation();
  const {
    startRouteTransition
  } = useRouteTransition();
  useEffect(() => {
    if (isActive) {
      openModal(modalSlug);
    } else {
      closeModal(modalSlug);
    }
  }, [isActive, openModal, closeModal]);
  return /*#__PURE__*/_jsx(Modal, {
    className: baseClass,
    onClose: () => {
      startRouteTransition(() => handleGoBack());
    },
    slug: modalSlug,
    children: /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__wrapper`,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__content`,
        children: [/*#__PURE__*/_jsx("h1", {
          children: t("general:documentLocked")
        }), /*#__PURE__*/_jsxs("p", {
          children: [/*#__PURE__*/_jsx("strong", {
            children: isClientUserObject(user) ? user.email ?? user.id : `${t("general:user")}: ${user}`
          }), " ", t("general:currentlyEditing")]
        }), /*#__PURE__*/_jsxs("p", {
          children: [t("general:editedSince"), " ", /*#__PURE__*/_jsx("strong", {
            children: formatDate(updatedAt)
          })]
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__controls`,
        children: [/*#__PURE__*/_jsx(Button, {
          buttonStyle: "secondary",
          id: `${modalSlug}-go-back`,
          onClick: () => {
            startRouteTransition(() => handleGoBack());
          },
          size: "large",
          children: t("general:goBack")
        }), /*#__PURE__*/_jsx(Button, {
          buttonStyle: "secondary",
          id: `${modalSlug}-view-read-only`,
          onClick: () => {
            onReadOnly();
            closeModal(modalSlug);
          },
          size: "large",
          children: t("general:viewReadOnly")
        }), /*#__PURE__*/_jsx(Button, {
          buttonStyle: "primary",
          id: `${modalSlug}-take-over`,
          onClick: () => {
            void onTakeOver();
            closeModal(modalSlug);
          },
          size: "large",
          children: t("general:takeOver")
        })]
      })]
    })
  });
};
//# sourceMappingURL=index.js.map