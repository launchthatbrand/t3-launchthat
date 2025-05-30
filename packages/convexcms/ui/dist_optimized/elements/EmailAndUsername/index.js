"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { email, username } from "@convexcms/core/shared";
import { EmailField } from "../../fields/Email/index.js";
import { TextField } from "../../fields/Text/index.js";
export function EmailAndUsernameFields(props) {
  const {
    className,
    loginWithUsername,
    readOnly,
    t
  } = props;
  const showEmailField = !loginWithUsername || loginWithUsername?.requireEmail || loginWithUsername?.allowEmailLogin;
  const showUsernameField = Boolean(loginWithUsername);
  return /*#__PURE__*/_jsxs("div", {
    className: className,
    children: [showEmailField ? /*#__PURE__*/_jsx(EmailField, {
      field: {
        name: "email",
        admin: {
          autoComplete: "off"
        },
        label: t("general:email"),
        required: !loginWithUsername || loginWithUsername && loginWithUsername.requireEmail
      },
      path: "email",
      readOnly: readOnly,
      schemaPath: "email",
      validate: email
    }) : null, showUsernameField && /*#__PURE__*/_jsx(TextField, {
      field: {
        name: "username",
        label: t("authentication:username"),
        required: loginWithUsername && loginWithUsername.requireUsername
      },
      path: "username",
      readOnly: readOnly,
      schemaPath: "username",
      validate: username
    })]
  });
}
//# sourceMappingURL=index.js.map