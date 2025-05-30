"use client";

import "./index.scss";

import type { FormState } from "@convexcms/core";
import type { UserWithToken } from "@convexcms/ui";
import React from "react";
import { formatAdminURL, getLoginOptions } from "@convexcms/core/shared";
import {
  Form,
  FormSubmit,
  Link,
  PasswordField,
  useAuth,
  useConfig,
  useTranslation,
} from "@convexcms/ui";

import type { LoginFieldProps } from "../LoginField/index.js";
import { getSafeRedirect } from "../../../utilities/getSafeRedirect.js";
import { LoginField } from "../LoginField/index.js";

const baseClass = "login__form";

export const LoginForm: React.FC<{
  prefillEmail?: string;
  prefillPassword?: string;
  prefillUsername?: string;
  searchParams: { [key: string]: string | string[] | undefined };
}> = ({ prefillEmail, prefillPassword, prefillUsername, searchParams }) => {
  const { config, getEntityConfig } = useConfig();

  const {
    admin: {
      routes: { forgot: forgotRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute, api: apiRoute },
  } = config;

  const collectionConfig = getEntityConfig({ collectionSlug: userSlug });
  const { auth: authOptions } = collectionConfig;
  const loginWithUsername = authOptions.loginWithUsername;
  const { canLoginWithEmail, canLoginWithUsername } =
    getLoginOptions(loginWithUsername);

  const [loginType] = React.useState<LoginFieldProps["type"]>(() => {
    if (canLoginWithEmail && canLoginWithUsername) {
      return "emailOrUsername";
    }
    if (canLoginWithUsername) {
      return "username";
    }
    return "email";
  });

  const { t } = useTranslation();
  const { setUser } = useAuth();

  const initialState: FormState = {
    password: {
      initialValue: prefillPassword ?? undefined,
      valid: true,
      value: prefillPassword ?? undefined,
    },
  };

  if (loginWithUsername) {
    initialState.username = {
      initialValue: prefillUsername ?? undefined,
      valid: true,
      value: prefillUsername ?? undefined,
    };
  } else {
    initialState.email = {
      initialValue: prefillEmail ?? undefined,
      valid: true,
      value: prefillEmail ?? undefined,
    };
  }

  const handleLogin = (data: UserWithToken) => {
    setUser(data);
  };

  return (
    <Form
      action={`${apiRoute}/${userSlug}/login`}
      className={baseClass}
      disableSuccessStatus
      initialState={initialState}
      method="POST"
      onSuccess={handleLogin}
      redirect={getSafeRedirect(searchParams?.redirect, adminRoute)}
      waitForAutocomplete
    >
      <div className={`${baseClass}__inputWrap`}>
        <LoginField type={loginType} />
        <PasswordField
          field={{
            name: "password",
            label: t("general:password"),
            required: true,
          }}
          path="password"
        />
      </div>
      <Link
        href={formatAdminURL({
          adminRoute,
          path: forgotRoute,
        })}
        prefetch={false}
      >
        {t("authentication:forgotPasswordQuestion")}
      </Link>
      <FormSubmit size="large">{t("authentication:login")}</FormSubmit>
    </Form>
  );
};
