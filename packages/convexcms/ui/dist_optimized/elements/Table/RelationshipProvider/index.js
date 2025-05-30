"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useCallback, useEffect, useReducer, useRef } from "react";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { useConfig } from "../../../providers/Config/index.js";
import { useLocale } from "../../../providers/Locale/index.js";
import { useTranslation } from "../../../providers/Translation/index.js";
import { reducer } from "./reducer.js";
const Context = /*#__PURE__*/createContext({});
export const RelationshipProvider = ({
  children
}) => {
  const [documents, dispatchDocuments] = useReducer(reducer, {});
  const debouncedDocuments = useDebounce(documents, 100);
  const {
    config: {
      routes: {
        api
      },
      serverURL
    }
  } = useConfig();
  const {
    i18n
  } = useTranslation();
  const {
    code: locale
  } = useLocale();
  const prevLocale = useRef(locale);
  const loadRelationshipDocs = useCallback((reloadAll = false) => {
    Object.entries(debouncedDocuments).forEach(async ([slug, docs]) => {
      const idsToLoad = [];
      Object.entries(docs).forEach(([id, value]) => {
        if (value === null || reloadAll) {
          idsToLoad.push(id);
        }
      });
      if (idsToLoad.length > 0) {
        const url = `${serverURL}${api}/${slug}`;
        const params = new URLSearchParams();
        params.append("depth", "0");
        params.append("limit", "250");
        if (locale) {
          params.append("locale", locale);
        }
        if (idsToLoad && idsToLoad.length > 0) {
          const idsToString = idsToLoad.map(id => String(id));
          params.append("where[id][in]", idsToString.join(","));
        }
        const query = `?${params.toString()}`;
        const result = await fetch(`${url}${query}`, {
          credentials: "include",
          headers: {
            "Accept-Language": i18n.language
          }
        });
        if (result.ok) {
          const json = await result.json();
          if (json.docs) {
            dispatchDocuments({
              type: "ADD_LOADED",
              docs: json.docs,
              idsToLoad,
              relationTo: slug
            });
          }
        } else {
          dispatchDocuments({
            type: "ADD_LOADED",
            docs: [],
            idsToLoad,
            relationTo: slug
          });
        }
      }
    });
  }, [debouncedDocuments, serverURL, api, i18n, locale]);
  useEffect(() => {
    void loadRelationshipDocs(locale && prevLocale.current !== locale);
    prevLocale.current = locale;
  }, [locale, loadRelationshipDocs]);
  const getRelationships = useCallback(relationships => {
    dispatchDocuments({
      type: "REQUEST",
      docs: relationships
    });
  }, []);
  return /*#__PURE__*/_jsx(Context, {
    value: {
      documents,
      getRelationships
    },
    children: children
  });
};
export const useListRelationships = () => use(Context);
//# sourceMappingURL=index.js.map