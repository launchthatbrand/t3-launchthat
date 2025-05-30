'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useState } from 'react';
import { CopyIcon } from '../../icons/Copy/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Tooltip } from '../Tooltip/index.js';
import './index.scss';
const baseClass = 'copy-to-clipboard';
export const CopyToClipboard = ({
  defaultMessage,
  successMessage,
  value
}) => {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const {
    t
  } = useTranslation();
  if (value) {
    return /*#__PURE__*/_jsxs("button", {
      className: baseClass,
      onClick: () => {
        if (ref && ref.current) {
          ref.current.select();
          ref.current.setSelectionRange(0, value.length + 1);
          document.execCommand('copy');
          setCopied(true);
        }
      },
      onMouseEnter: () => {
        setHovered(true);
        setCopied(false);
      },
      onMouseLeave: () => {
        setHovered(false);
        setCopied(false);
      },
      type: "button",
      children: [/*#__PURE__*/_jsx(CopyIcon, {}), /*#__PURE__*/_jsxs(Tooltip, {
        delay: copied ? 0 : undefined,
        show: hovered || copied,
        children: [copied && (successMessage ?? t('general:copied')), !copied && (defaultMessage ?? t('general:copy'))]
      }), /*#__PURE__*/_jsx("textarea", {
        readOnly: true,
        ref: ref,
        tabIndex: -1,
        value: value
      })]
    });
  }
  return null;
};
//# sourceMappingURL=index.js.map