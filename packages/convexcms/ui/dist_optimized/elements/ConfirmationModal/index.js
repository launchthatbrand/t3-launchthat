'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Modal, useModal } from '@faceless-ui/modal';
import React, { useCallback } from 'react';
import { useTranslation } from '../../providers/Translation/index.js';
import { Button } from '../Button/index.js';
import { drawerZBase, useDrawerDepth } from '../Drawer/index.js';
import './index.scss';
const baseClass = 'confirmation-modal';
export function ConfirmationModal(props) {
  const $ = _c(33);
  const {
    body,
    cancelLabel,
    className,
    confirmingLabel,
    confirmLabel,
    heading,
    modalSlug,
    onCancel: onCancelFromProps,
    onConfirm: onConfirmFromProps
  } = props;
  const editDepth = useDrawerDepth();
  const [confirming, setConfirming] = React.useState(false);
  const {
    closeModal
  } = useModal();
  const {
    t
  } = useTranslation();
  let t0;
  if ($[0] !== closeModal || $[1] !== confirming || $[2] !== modalSlug || $[3] !== onConfirmFromProps) {
    t0 = async () => {
      if (!confirming) {
        setConfirming(true);
        if (typeof onConfirmFromProps === "function") {
          await onConfirmFromProps();
        }
        setConfirming(false);
        closeModal(modalSlug);
      }
    };
    $[0] = closeModal;
    $[1] = confirming;
    $[2] = modalSlug;
    $[3] = onConfirmFromProps;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  const onConfirm = t0;
  let t1;
  if ($[5] !== closeModal || $[6] !== confirming || $[7] !== modalSlug || $[8] !== onCancelFromProps) {
    t1 = () => {
      if (!confirming) {
        closeModal(modalSlug);
        if (typeof onCancelFromProps === "function") {
          onCancelFromProps();
        }
      }
    };
    $[5] = closeModal;
    $[6] = confirming;
    $[7] = modalSlug;
    $[8] = onCancelFromProps;
    $[9] = t1;
  } else {
    t1 = $[9];
  }
  const onCancel = t1;
  let t2;
  if ($[10] !== className) {
    t2 = [baseClass, className].filter(Boolean);
    $[10] = className;
    $[11] = t2;
  } else {
    t2 = $[11];
  }
  const t3 = t2.join(" ");
  const t4 = drawerZBase + editDepth;
  let t5;
  if ($[12] !== body || $[13] !== cancelLabel || $[14] !== confirmLabel || $[15] !== confirming || $[16] !== confirmingLabel || $[17] !== heading || $[18] !== modalSlug || $[19] !== onCancel || $[20] !== onConfirm || $[21] !== t || $[22] !== t3 || $[23] !== t4) {
    let t6;
    if ($[25] !== cancelLabel || $[26] !== t) {
      t6 = cancelLabel || t("general:cancel");
      $[25] = cancelLabel;
      $[26] = t;
      $[27] = t6;
    } else {
      t6 = $[27];
    }
    let t7;
    if ($[28] !== confirmLabel || $[29] !== confirming || $[30] !== confirmingLabel || $[31] !== t) {
      t7 = confirming ? confirmingLabel || `${t("general:loading")}...` : confirmLabel || t("general:confirm");
      $[28] = confirmLabel;
      $[29] = confirming;
      $[30] = confirmingLabel;
      $[31] = t;
      $[32] = t7;
    } else {
      t7 = $[32];
    }
    t5 = _jsx(Modal, {
      className: t3,
      slug: modalSlug,
      style: {
        zIndex: t4
      },
      children: _jsxs("div", {
        className: `${baseClass}__wrapper`,
        children: [_jsxs("div", {
          className: `${baseClass}__content`,
          children: [_jsx("h1", {
            children: heading
          }), _jsx("p", {
            children: body
          })]
        }), _jsxs("div", {
          className: `${baseClass}__controls`,
          children: [_jsx(Button, {
            buttonStyle: "secondary",
            disabled: confirming,
            id: "confirm-cancel",
            onClick: onCancel,
            size: "large",
            type: "button",
            children: t6
          }), _jsx(Button, {
            id: "confirm-action",
            onClick: onConfirm,
            size: "large",
            children: t7
          })]
        })]
      })
    });
    $[12] = body;
    $[13] = cancelLabel;
    $[14] = confirmLabel;
    $[15] = confirming;
    $[16] = confirmingLabel;
    $[17] = heading;
    $[18] = modalSlug;
    $[19] = onCancel;
    $[20] = onConfirm;
    $[21] = t;
    $[22] = t3;
    $[23] = t4;
    $[24] = t5;
  } else {
    t5 = $[24];
  }
  return t5;
}
//# sourceMappingURL=index.js.map