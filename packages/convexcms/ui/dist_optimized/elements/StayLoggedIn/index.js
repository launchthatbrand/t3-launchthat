"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback } from "react";
import { useRouter } from "next/navigation.js";
import { formatAdminURL } from "@convexcms/core/shared";
import { useAuth } from "../../providers/Auth/index.js";
import { useConfig } from "../../providers/Config/index.js";
import { useRouteTransition } from "../../providers/RouteTransition/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { ConfirmationModal } from "../ConfirmationModal/index.js";
export const stayLoggedInModalSlug = "stay-logged-in";
export const StayLoggedInModal = () => {
  const {
    refreshCookie
  } = useAuth();
  const router = useRouter();
  const {
    config
  } = useConfig();
  const {
    admin: {
      routes: {
        logout: logoutRoute
      }
    },
    routes: {
      admin: adminRoute
    }
  } = config;
  const {
    t
  } = useTranslation();
  const {
    startRouteTransition
  } = useRouteTransition();
  const onConfirm = useCallback(() => {
    return startRouteTransition(() => router.push(formatAdminURL({
      adminRoute,
      path: logoutRoute
    })));
  }, [router, startRouteTransition, adminRoute, logoutRoute]);
  const onCancel = useCallback(() => {
    refreshCookie();
  }, [refreshCookie]);
  return /*#__PURE__*/_jsx(ConfirmationModal, {
    body: t("authentication:youAreInactive"),
    cancelLabel: t("authentication:stayLoggedIn"),
    confirmLabel: t("authentication:logOut"),
    heading: t("authentication:stayLoggedIn"),
    modalSlug: stayLoggedInModalSlug,
    onCancel: onCancel,
    onConfirm: onConfirm
  });
};
//# sourceMappingURL=index.js.map