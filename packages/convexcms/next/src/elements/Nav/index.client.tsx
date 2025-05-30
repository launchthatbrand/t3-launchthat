"use client";

import type { NavPreferences } from "@convexcms/core";
import type { groupNavItems } from "@convexcms/ui/shared";
import React, { Fragment } from "react";
import { usePathname } from "next/navigation.js";
import { formatAdminURL } from "@convexcms/core/shared";
import { getTranslation } from "@convexcms/translations";
import { Link, NavGroup, useConfig, useTranslation } from "@convexcms/ui";
import { EntityType } from "@convexcms/ui/shared";

const baseClass = "nav";

export const DefaultNavClient: React.FC<{
  groups: ReturnType<typeof groupNavItems>;
  navPreferences: NavPreferences;
}> = ({ groups, navPreferences }) => {
  const pathname = usePathname();

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();

  const { i18n } = useTranslation();

  return (
    <Fragment>
      {groups.map(({ entities, label }, key) => {
        return (
          <NavGroup
            isOpen={navPreferences?.groups?.[label]?.open}
            key={key}
            label={label}
          >
            {entities.map(({ slug, type, label }, i) => {
              let href: string;
              let id: string;

              if (type === EntityType.collection) {
                href = formatAdminURL({
                  adminRoute,
                  path: `/collections/${slug}`,
                });
                id = `nav-${slug}`;
              }

              if (type === EntityType.global) {
                href = formatAdminURL({ adminRoute, path: `/globals/${slug}` });
                id = `nav-global-${slug}`;
              }

              const isActive =
                pathname.startsWith(href) &&
                ["/", undefined].includes(pathname[href.length]);

              const Label = (
                <>
                  {isActive && (
                    <div className={`${baseClass}__link-indicator`} />
                  )}
                  <span className={`${baseClass}__link-label`}>
                    {getTranslation(label, i18n)}
                  </span>
                </>
              );

              // If the URL matches the link exactly
              if (pathname === href) {
                return (
                  <div className={`${baseClass}__link`} id={id} key={i}>
                    {Label}
                  </div>
                );
              }

              return (
                <Link
                  className={`${baseClass}__link`}
                  href={href}
                  id={id}
                  key={i}
                  prefetch={false}
                >
                  {Label}
                </Link>
              );
            })}
          </NavGroup>
        );
      })}
    </Fragment>
  );
};
