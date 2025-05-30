"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { Fragment } from "react";
import { useRouter } from "next/navigation.js";
import { getTranslation } from "@convexcms/translations";
import * as qs from "qs-esm";
import { useConfig } from "../../providers/Config/index.js";
import { useLocale, useLocaleLoading } from "../../providers/Locale/index.js";
import { useRouteTransition } from "../../providers/RouteTransition/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { Popup, PopupList } from "../Popup/index.js";
import { LocalizerLabel } from "./LocalizerLabel/index.js";
const baseClass = "localizer";
export const Localizer = props => {
  const {
    className
  } = props;
  const {
    config: {
      localization
    }
  } = useConfig();
  const router = useRouter();
  const {
    startRouteTransition
  } = useRouteTransition();
  const {
    setLocaleIsLoading
  } = useLocaleLoading();
  const {
    i18n
  } = useTranslation();
  const locale = useLocale();
  if (localization) {
    const {
      locales
    } = localization;
    return /*#__PURE__*/_jsx("div", {
      className: [baseClass, className].filter(Boolean).join(" "),
      children: /*#__PURE__*/_jsx(Popup, {
        button: /*#__PURE__*/_jsx(LocalizerLabel, {}),
        horizontalAlign: "right",
        render: ({
          close
        }) => /*#__PURE__*/_jsx(PopupList.ButtonGroup, {
          children: locales.map(localeOption => {
            const localeOptionLabel = getTranslation(localeOption.label, i18n);
            return /*#__PURE__*/_jsx(PopupList.Button, {
              active: locale.code === localeOption.code,
              disabled: locale.code === localeOption.code,
              onClick: () => {
                setLocaleIsLoading(true);
                close();
                // can't use `useSearchParams` here because it is stale due to `window.history.pushState` in `ListQueryProvider`
                const searchParams = new URLSearchParams(window.location.search);
                const url = qs.stringify({
                  ...qs.parse(searchParams.toString(), {
                    depth: 10,
                    ignoreQueryPrefix: true
                  }),
                  locale: localeOption.code
                }, {
                  addQueryPrefix: true
                });
                startRouteTransition(() => {
                  router.push(url);
                });
              },
              children: localeOptionLabel !== localeOption.code ? /*#__PURE__*/_jsxs(Fragment, {
                children: [localeOptionLabel, " ", /*#__PURE__*/_jsx("span", {
                  className: `${baseClass}__locale-code`,
                  "data-locale": localeOption.code,
                  children: `(${localeOption.code})`
                })]
              }) : /*#__PURE__*/_jsx("span", {
                className: `${baseClass}__locale-code`,
                "data-locale": localeOption.code,
                children: localeOptionLabel
              })
            }, localeOption.code);
          })
        }),
        showScrollbar: true,
        size: "large"
      })
    });
  }
  return null;
};
//# sourceMappingURL=index.js.map