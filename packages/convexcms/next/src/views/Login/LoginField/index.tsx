"use client";

// import { email, username } from "@convexcms/core/shared"; // Commented out - Exports do not exist
import type { Validate, ValidateOptions } from "@convexcms/core";
import React from "react";
import { EmailField, TextField, useTranslation } from "@convexcms/ui";

export type LoginFieldProps = {
  readonly required?: boolean;
  readonly type: "email" | "emailOrUsername" | "username";
  readonly validate?: Validate;
};

export const LoginField: React.FC<LoginFieldProps> = ({
  type,
  required = true,
}) => {
  const { t } = useTranslation();

  if (type === "email") {
    return (
      <EmailField
        field={{
          name: "email",
          admin: {
            autoComplete: "email",
          },
          label: t("general:email"),
          required,
        }}
        path="email"
        validate={(value: string): string | true => {
          // TODO: Re-implement or find appropriate email validation
          // return email(value, options);
          return true; // Placeholder validation
        }}
      />
    );
  }

  if (type === "username") {
    return (
      <TextField
        field={{
          name: "username",
          label: t("authentication:username"),
          required,
        }}
        path="username"
        validate={(value: string): string | true => {
          // TODO: Re-implement or find appropriate username validation
          // return username(value, options);
          return true; // Placeholder validation
        }}
      />
    );
  }

  if (type === "emailOrUsername") {
    return (
      <TextField
        field={{
          name: "username",
          label: t("authentication:emailOrUsername"),
          required,
        }}
        path="username"
        validate={(value, options) => {
          const passesUsername = (value: string): string | true => {
            // TODO: Re-implement or find appropriate username validation
            // return username(value, options);
            return true; // Placeholder validation
          };
          const passesEmail = (value: string): string | true => {
            // TODO: Re-implement or find appropriate email validation
            // return email(value, options as ValidateOptions<any, { username?: string }, any, any>);
            return true; // Placeholder validation
          };

          if (!passesEmail(value) && !passesUsername(value)) {
            return `${t("general:email")}: ${passesEmail(value)} ${t("general:username")}: ${passesUsername(value)}`;
          }

          return true;
        }}
      />
    );
  }

  return null;
};
