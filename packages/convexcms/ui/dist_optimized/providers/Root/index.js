"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Fragment } from "react";
import { ModalContainer, ModalProvider } from "@faceless-ui/modal";
import { ScrollInfoProvider } from "@faceless-ui/scroll-info";
import { LoadingOverlayProvider } from "../../elements/LoadingOverlay/index.js";
import { NavProvider } from "../../elements/Nav/context.js";
import { StayLoggedInModal } from "../../elements/StayLoggedIn/index.js";
import { StepNavProvider } from "../../elements/StepNav/index.js";
import { WindowInfoProvider } from "../../providers/WindowInfo/index.js";
import { AuthProvider } from "../Auth/index.js";
import { ClientFunctionProvider } from "../ClientFunction/index.js";
import { ConfigProvider } from "../Config/index.js";
import { DocumentEventsProvider } from "../DocumentEvents/index.js";
import { LocaleProvider } from "../Locale/index.js";
import { ParamsProvider } from "../Params/index.js";
import { PreferencesProvider } from "../Preferences/index.js";
import { RouteCache } from "../RouteCache/index.js";
import { RouteTransitionProvider } from "../RouteTransition/index.js";
import { SearchParamsProvider } from "../SearchParams/index.js";
import { ServerFunctionsProvider } from "../ServerFunctions/index.js";
import { ThemeProvider } from "../Theme/index.js";
import { ToastContainer } from "../ToastContainer/index.js";
import { TranslationProvider } from "../Translation/index.js";
import { UploadHandlersProvider } from "../UploadHandlers/index.js";
export const RootProvider = ({
  children,
  config,
  dateFNSKey,
  fallbackLang,
  isNavOpen,
  languageCode,
  languageOptions,
  locale,
  permissions,
  serverFunction,
  switchLanguageServerAction,
  theme,
  translations,
  user
}) => {
  const RouteCacheComponent = process.env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH === "true" ? RouteCache : Fragment;
  return /*#__PURE__*/_jsxs(Fragment, {
    children: [/*#__PURE__*/_jsx(ServerFunctionsProvider, {
      serverFunction: serverFunction,
      children: /*#__PURE__*/_jsx(RouteTransitionProvider, {
        children: /*#__PURE__*/_jsx(RouteCacheComponent, {
          children: /*#__PURE__*/_jsx(ConfigProvider, {
            config: config,
            children: /*#__PURE__*/_jsx(ClientFunctionProvider, {
              children: /*#__PURE__*/_jsx(TranslationProvider, {
                dateFNSKey: dateFNSKey,
                fallbackLang: fallbackLang,
                language: languageCode,
                languageOptions: languageOptions,
                switchLanguageServerAction: switchLanguageServerAction,
                translations: translations,
                children: /*#__PURE__*/_jsx(WindowInfoProvider, {
                  breakpoints: {
                    l: "(max-width: 1440px)",
                    m: "(max-width: 1024px)",
                    s: "(max-width: 768px)",
                    xs: "(max-width: 400px)"
                  },
                  children: /*#__PURE__*/_jsx(ScrollInfoProvider, {
                    children: /*#__PURE__*/_jsx(SearchParamsProvider, {
                      children: /*#__PURE__*/_jsx(ModalProvider, {
                        classPrefix: "@convexcms/core",
                        transTime: 0,
                        zIndex: "var(--z-modal)",
                        children: /*#__PURE__*/_jsxs(AuthProvider, {
                          permissions: permissions,
                          user: user,
                          children: [/*#__PURE__*/_jsx(PreferencesProvider, {
                            children: /*#__PURE__*/_jsx(ThemeProvider, {
                              theme: theme,
                              children: /*#__PURE__*/_jsx(ParamsProvider, {
                                children: /*#__PURE__*/_jsx(LocaleProvider, {
                                  locale: locale,
                                  children: /*#__PURE__*/_jsx(StepNavProvider, {
                                    children: /*#__PURE__*/_jsx(LoadingOverlayProvider, {
                                      children: /*#__PURE__*/_jsx(DocumentEventsProvider, {
                                        children: /*#__PURE__*/_jsx(NavProvider, {
                                          initialIsOpen: isNavOpen,
                                          children: /*#__PURE__*/_jsx(UploadHandlersProvider, {
                                            children: children
                                          })
                                        })
                                      })
                                    })
                                  })
                                })
                              })
                            })
                          }), /*#__PURE__*/_jsx(ModalContainer, {}), /*#__PURE__*/_jsx(StayLoggedInModal, {})]
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    }), /*#__PURE__*/_jsx(ToastContainer, {})]
  });
};
//# sourceMappingURL=index.js.map