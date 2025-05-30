'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback } from 'react';
import { useForm, useFormModified } from '../../forms/Form/index.js';
import { useAuth } from '../../providers/Auth/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { ConfirmationModal } from '../ConfirmationModal/index.js';
import { useModal } from '../Modal/index.js';
import { usePreventLeave } from './usePreventLeave.js';
const modalSlug = 'leave-without-saving';
export const LeaveWithoutSaving = () => {
  const $ = _c(15);
  const {
    closeModal,
    openModal
  } = useModal();
  const modified = useFormModified();
  const {
    isValid
  } = useForm();
  const {
    user
  } = useAuth();
  const [hasAccepted, setHasAccepted] = React.useState(false);
  const {
    t
  } = useTranslation();
  const prevent = Boolean((modified || !isValid) && user);
  let t0;
  if ($[0] !== openModal) {
    t0 = () => {
      openModal(modalSlug);
    };
    $[0] = openModal;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onPrevent = t0;
  let t1;
  if ($[2] !== closeModal) {
    t1 = () => {
      closeModal(modalSlug);
    };
    $[2] = closeModal;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const handleAccept = t1;
  let t2;
  if ($[4] !== handleAccept || $[5] !== hasAccepted || $[6] !== onPrevent || $[7] !== prevent) {
    t2 = {
      hasAccepted,
      onAccept: handleAccept,
      onPrevent,
      prevent
    };
    $[4] = handleAccept;
    $[5] = hasAccepted;
    $[6] = onPrevent;
    $[7] = prevent;
    $[8] = t2;
  } else {
    t2 = $[8];
  }
  usePreventLeave(t2);
  let t3;
  if ($[9] !== closeModal) {
    t3 = () => {
      closeModal(modalSlug);
    };
    $[9] = closeModal;
    $[10] = t3;
  } else {
    t3 = $[10];
  }
  const onCancel = t3;
  let t4;
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = () => {
      setHasAccepted(true);
    };
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  const onConfirm = t4;
  let t5;
  if ($[12] !== onCancel || $[13] !== t) {
    t5 = _jsx(ConfirmationModal, {
      body: t("general:changesNotSaved"),
      cancelLabel: t("general:stayOnThisPage"),
      confirmLabel: t("general:leaveAnyway"),
      heading: t("general:leaveWithoutSaving"),
      modalSlug,
      onCancel,
      onConfirm
    });
    $[12] = onCancel;
    $[13] = t;
    $[14] = t5;
  } else {
    t5 = $[14];
  }
  return t5;
};
//# sourceMappingURL=index.js.map