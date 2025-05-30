'use client';

import { jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
import { sanitizeID } from '../../utilities/sanitizeID.js';
const baseClass = 'id-label';
export const IDLabel = ({
  id,
  className,
  prefix = 'ID:'
}) => /*#__PURE__*/_jsxs("div", {
  className: [baseClass, className].filter(Boolean).join(' '),
  title: id,
  children: [prefix, " ", sanitizeID(id)]
});
//# sourceMappingURL=index.js.map