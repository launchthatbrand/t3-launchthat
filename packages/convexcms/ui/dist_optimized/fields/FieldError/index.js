"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { Tooltip } from "../../elements/Tooltip/index.js";
import { useFormFields, useFormSubmitted } from "../../forms/Form/context.js";
const baseClass = "field-error";
export const FieldError = props => {
  const {
    alignCaret = "right",
    message: messageFromProps,
    path,
    showError: showErrorFromProps
  } = props;
  const hasSubmitted = useFormSubmitted();
  const field = useFormFields(([fields]) => fields && fields?.[path] || null);
  const {
    errorMessage,
    valid
  } = field || {};
  const message = messageFromProps || errorMessage;
  const showMessage = showErrorFromProps || hasSubmitted && valid === false;
  if (showMessage && message?.length) {
    return /*#__PURE__*/_jsx(Tooltip, {
      alignCaret: alignCaret,
      className: baseClass,
      delay: 0,
      staticPositioning: true,
      children: message
    });
  }
  return null;
};
//# sourceMappingURL=index.js.map