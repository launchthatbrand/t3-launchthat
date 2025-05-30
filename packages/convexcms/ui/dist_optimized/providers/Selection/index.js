"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation.js";
import * as qs from "qs-esm";
import { parseSearchParams } from "../../utilities/parseSearchParams.js";
import { useLocale } from "../Locale/index.js";
export var SelectAllStatus = /*#__PURE__*/function (SelectAllStatus) {
  SelectAllStatus["AllAvailable"] = "allAvailable";
  SelectAllStatus["AllInPage"] = "allInPage";
  SelectAllStatus["None"] = "none";
  SelectAllStatus["Some"] = "some";
  return SelectAllStatus;
}({});
const Context = /*#__PURE__*/createContext({});
export const SelectionProvider = ({
  children,
  docs = [],
  totalDocs,
  user
}) => {
  const contextRef = useRef({});
  const {
    code: locale
  } = useLocale();
  const [selected, setSelected] = useState(() => {
    const rows = new Map();
    docs.forEach(({
      id
    }) => {
      rows.set(id, false);
    });
    return rows;
  });
  const [selectAll, setSelectAll] = useState("none");
  const [count, setCount] = useState(0);
  const searchParams = useSearchParams();
  const toggleAll = useCallback((allAvailable = false) => {
    const rows = new Map();
    if (allAvailable) {
      setSelectAll("allAvailable");
      docs.forEach(({
        id,
        _isLocked,
        _userEditing
      }) => {
        if (!_isLocked || _userEditing?.id === user?.id) {
          rows.set(id, true);
        }
      });
    } else if (selectAll === "allAvailable" || selectAll === "allInPage") {
      setSelectAll("none");
    } else {
      docs.forEach(({
        id,
        _isLocked,
        _userEditing
      }) => {
        if (!_isLocked || _userEditing?.id === user?.id) {
          rows.set(id, selectAll !== "some");
        }
      });
    }
    setSelected(rows);
  }, [docs, selectAll, user?.id]);
  const setSelection = useCallback(id => {
    const doc = docs.find(doc => doc.id === id);
    if (doc?._isLocked && user?.id !== doc?._userEditing.id) {
      return; // Prevent selection if the document is locked
    }
    const existingValue = selected.get(id);
    const isSelected = typeof existingValue === "boolean" ? !existingValue : true;
    const newMap = new Map(selected.set(id, isSelected));
    // If previously selected all and now deselecting, adjust status
    if (selectAll === "allAvailable" && !isSelected) {
      setSelectAll("some");
    }
    setSelected(newMap);
  }, [selected, docs, selectAll, user?.id]);
  const getQueryParams = useCallback(additionalWhereParams => {
    let where;
    if (selectAll === "allAvailable") {
      const params = parseSearchParams(searchParams)?.where;
      where = params || {
        id: {
          not_equals: ""
        }
      };
    } else {
      const ids = [];
      for (const [key, value] of selected) {
        if (value) {
          ids.push(key);
        }
      }
      where = {
        id: {
          in: ids
        }
      };
    }
    if (additionalWhereParams) {
      where = {
        and: [{
          ...additionalWhereParams
        }, where]
      };
    }
    return qs.stringify({
      locale,
      where
    }, {
      addQueryPrefix: true
    });
  }, [selectAll, selected, locale, searchParams]);
  useEffect(() => {
    if (selectAll === "allAvailable") {
      return;
    }
    let some = false;
    let all = true;
    if (!selected.size) {
      all = false;
      some = false;
    } else {
      for (const [_, value] of selected) {
        all = all && value;
        some = some || value;
      }
    }
    if (all && selected.size === docs.length) {
      setSelectAll("allInPage");
    } else if (some) {
      setSelectAll("some");
    } else {
      setSelectAll("none");
    }
  }, [selectAll, selected, totalDocs, docs]);
  useEffect(() => {
    let newCount = 0;
    if (selectAll === "allAvailable") {
      newCount = totalDocs;
    } else {
      for (const [_, value] of selected) {
        if (value) {
          newCount++;
        }
      }
    }
    setCount(newCount);
  }, [selectAll, selected, totalDocs]);
  contextRef.current = {
    count,
    getQueryParams,
    selectAll,
    selected,
    setSelection,
    toggleAll,
    totalDocs
  };
  return /*#__PURE__*/_jsx(Context, {
    value: contextRef.current,
    children: children
  });
};
export const useSelection = () => use(Context);
//# sourceMappingURL=index.js.map