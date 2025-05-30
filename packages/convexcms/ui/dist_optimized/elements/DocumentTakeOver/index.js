'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { useRouteTransition } from '../../providers/RouteTransition/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Button } from '../Button/index.js';
import { Modal, useModal } from '../Modal/index.js';
import './index.scss';
const modalSlug = 'document-take-over';
const baseClass = 'document-take-over';
export const DocumentTakeOver = t0 => {
  const $ = _c(17);
  const {
    handleBackToDashboard,
    isActive,
    onReadOnly
  } = t0;
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
  let t1;
  let t2;
  if ($[0] !== closeModal || $[1] !== isActive || $[2] !== openModal) {
    t1 = () => {
      if (isActive) {
        openModal(modalSlug);
      } else {
        closeModal(modalSlug);
      }
    };
    t2 = [isActive, openModal, closeModal];
    $[0] = closeModal;
    $[1] = isActive;
    $[2] = openModal;
    $[3] = t1;
    $[4] = t2;
  } else {
    t1 = $[3];
    t2 = $[4];
  }
  useEffect(t1, t2);
  let t3;
  if ($[5] !== closeModal || $[6] !== handleBackToDashboard || $[7] !== onReadOnly || $[8] !== startRouteTransition || $[9] !== t) {
    let t4;
    if ($[11] !== handleBackToDashboard || $[12] !== startRouteTransition) {
      t4 = () => {
        startRouteTransition(() => handleBackToDashboard());
      };
      $[11] = handleBackToDashboard;
      $[12] = startRouteTransition;
      $[13] = t4;
    } else {
      t4 = $[13];
    }
    let t5;
    if ($[14] !== closeModal || $[15] !== onReadOnly) {
      t5 = () => {
        onReadOnly();
        closeModal(modalSlug);
      };
      $[14] = closeModal;
      $[15] = onReadOnly;
      $[16] = t5;
    } else {
      t5 = $[16];
    }
    t3 = _jsx(Modal, {
      className: baseClass,
      slug: modalSlug,
      children: _jsxs("div", {
        className: `${baseClass}__wrapper`,
        children: [_jsxs("div", {
          className: `${baseClass}__content`,
          children: [_jsx("h1", {
            children: t("general:editingTakenOver")
          }), _jsx("p", {
            children: t("general:anotherUserTakenOver")
          })]
        }), _jsxs("div", {
          className: `${baseClass}__controls`,
          children: [_jsx(Button, {
            buttonStyle: "primary",
            id: `${modalSlug}-back-to-dashboard`,
            onClick: t4,
            size: "large",
            children: t("general:backToDashboard")
          }), _jsx(Button, {
            buttonStyle: "secondary",
            id: `${modalSlug}-view-read-only`,
            onClick: t5,
            size: "large",
            children: t("general:viewReadOnly")
          })]
        })]
      })
    });
    $[5] = closeModal;
    $[6] = handleBackToDashboard;
    $[7] = onReadOnly;
    $[8] = startRouteTransition;
    $[9] = t;
    $[10] = t3;
  } else {
    t3 = $[10];
  }
  return t3;
};
//# sourceMappingURL=index.js.map