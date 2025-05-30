'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import React, { useCallback } from 'react';
import { toast } from 'sonner';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Button } from '../Button/index.js';
import { ConfirmationModal } from '../ConfirmationModal/index.js';
import { Translation } from '../Translation/index.js';
export function GenerateConfirmation(props) {
  const {
    highlightField,
    setKey
  } = props;
  const {
    id
  } = useDocumentInfo();
  const {
    toggleModal
  } = useModal();
  const {
    t
  } = useTranslation();
  const modalSlug = `generate-confirmation-${id}`;
  const handleGenerate = useCallback(() => {
    setKey();
    toast.success(t('authentication:newAPIKeyGenerated'));
    highlightField(true);
  }, [highlightField, setKey, t]);
  return /*#__PURE__*/_jsxs(React.Fragment, {
    children: [/*#__PURE__*/_jsx(Button, {
      buttonStyle: "secondary",
      onClick: () => {
        toggleModal(modalSlug);
      },
      size: "small",
      children: t('authentication:generateNewAPIKey')
    }), /*#__PURE__*/_jsx(ConfirmationModal, {
      body: /*#__PURE__*/_jsx(Translation, {
        elements: {
          1: ({
            children
          }) => /*#__PURE__*/_jsx("strong", {
            children: children
          })
        },
        i18nKey: "authentication:generatingNewAPIKeyWillInvalidate",
        t: t
      }),
      confirmLabel: t('authentication:generate'),
      heading: t('authentication:confirmGeneration'),
      modalSlug: modalSlug,
      onConfirm: handleGenerate
    })]
  });
}
//# sourceMappingURL=index.js.map