"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation.js";
import { findLocaleFromCode } from "../../utilities/findLocaleFromCode.js";
import { useAuth } from "../Auth/index.js";
import { useConfig } from "../Config/index.js";
import { usePreferences } from "../Preferences/index.js";
const LocaleContext = /*#__PURE__*/createContext({});
export const LocaleLoadingContext = /*#__PURE__*/createContext({
  localeIsLoading: false,
  setLocaleIsLoading: _ => undefined
});
const fetchPreferences = async (key, baseURL) => await fetch(`${baseURL}/payload-preferences/${key}`, {
  credentials: "include",
  headers: {
    "Content-Type": "application/json"
  },
  method: "GET"
})?.then(res => res.json());
export const LocaleProvider = ({
  children,
  /**
  The `locale` prop originates from the root layout, which does not have access to search params
  This component uses the `useSearchParams` hook to get the locale from the URL as precedence over this prop
  This prop does not update as the user navigates the site, because the root layout does not re-render
  */
  locale: initialLocaleFromPrefs
}) => {
  const {
    config: {
      localization = false,
      routes: {
        api: apiRoute
      },
      serverURL
    }
  } = useConfig();
  const {
    user
  } = useAuth();
  const defaultLocale = localization ? localization.defaultLocale : "en";
  const {
    getPreference,
    setPreference
  } = usePreferences();
  const localeFromParams = useSearchParams().get("locale");
  const [locale, setLocale] = React.useState(() => {
    if (!localization || localization && !localization.locales.length) {
      // TODO: return null V4
      return {};
    }
    return findLocaleFromCode(localization, localeFromParams) || findLocaleFromCode(localization, initialLocaleFromPrefs) || findLocaleFromCode(localization, defaultLocale) || findLocaleFromCode(localization, localization.locales[0].code);
  });
  const [isLoading, setLocaleIsLoading] = useState(false);
  const prevLocale = useRef(locale);
  useEffect(() => {
    /**
    * We need to set `isLoading` back to false once the locale is detected to be different
    * This happens when the user clicks an anchor link which appends the `?locale=` query param
    * This triggers a client-side navigation, which re-renders the page with the new locale
    * In Next.js, local state is persisted during this type of navigation because components are not unmounted
    */
    if (locale.code !== prevLocale.current.code) {
      setLocaleIsLoading(false);
    }
    prevLocale.current = locale;
  }, [locale]);
  const fetchURL = `${serverURL}${apiRoute}`;
  useEffect(() => {
    /**
    * This effect should only run when `localeFromParams` changes, i.e. when the user clicks an anchor link
    * The root layout, which sends the initial locale from prefs, will not re-render as the user navigates the site
    * For this reason, we need to fetch the locale from prefs if the search params clears the `locale` query param
    */
    async function resetLocale() {
      if (localization && user?.id) {
        const localeToUse = localeFromParams || (await fetchPreferences("locale", fetchURL)?.then(res => res.value));
        const newLocale = findLocaleFromCode(localization, localeToUse) || findLocaleFromCode(localization, defaultLocale) || findLocaleFromCode(localization, localization?.locales?.[0]?.code);
        if (newLocale) {
          setLocale(newLocale);
        }
      }
    }
    void resetLocale();
  }, [defaultLocale, getPreference, localization, fetchURL, localeFromParams, user?.id]);
  return /*#__PURE__*/_jsx(LocaleContext, {
    value: locale,
    children: /*#__PURE__*/_jsx(LocaleLoadingContext, {
      value: {
        localeIsLoading: isLoading,
        setLocaleIsLoading
      },
      children: children
    })
  });
};
export const useLocaleLoading = () => use(LocaleLoadingContext);
/**
 * TODO: V4
 * The return type of the `useLocale` hook will change in v4. It will return `null | Locale` instead of `false | {} | Locale`.
 */
export const useLocale = () => use(LocaleContext);
//# sourceMappingURL=index.js.map