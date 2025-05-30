import "./index.scss";

import type { AdminViewServerProps } from "@convexcms/core";
import React from "react";
import { formatAdminURL } from "@convexcms/core/shared";
import { Button } from "@convexcms/ui";

import { FormHeader } from "../../elements/FormHeader/index.js";

const baseClass = "unauthorized";

export function UnauthorizedView({ initPageResult }: AdminViewServerProps) {
  const {
    permissions,
    req: {
      i18n,
      payload: {
        config: {
          admin: {
            routes: { logout: logoutRoute },
          },
          routes: { admin: adminRoute },
        },
      },
      user,
    },
  } = initPageResult;

  return (
    <div className={baseClass}>
      <FormHeader
        description={i18n.t("error:notAllowedToAccessPage")}
        heading={i18n.t(
          user && !permissions.canAccessAdmin
            ? "error:unauthorizedAdmin"
            : "error:unauthorized",
        )}
      />
      <Button
        className={`${baseClass}__button`}
        el="link"
        size="large"
        to={formatAdminURL({
          adminRoute,
          path: logoutRoute,
        })}
      >
        {i18n.t("authentication:logOut")}
      </Button>
    </div>
  );
}
