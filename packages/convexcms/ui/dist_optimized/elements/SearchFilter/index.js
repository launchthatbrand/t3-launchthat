'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import './index.scss';
const baseClass = 'search-filter';
export const SearchFilter = props => {
  const {
    handleChange,
    initialParams,
    label
  } = props;
  const pathname = usePathname();
  const [search, setSearch] = useState(typeof initialParams?.search === 'string' ? initialParams?.search : undefined);
  /**
  * Tracks whether the state should be updated based on the search value.
  * If the value is updated from the URL, we don't want to update the state as it causes additional renders.
  */
  const shouldUpdateState = useRef(true);
  /**
  * Tracks the previous search value to compare with the current debounced search value.
  */
  const previousSearch = useRef(typeof initialParams?.search === 'string' ? initialParams?.search : undefined);
  const debouncedSearch = useDebounce(search, 300);
  useEffect(() => {
    if (initialParams?.search !== previousSearch.current) {
      shouldUpdateState.current = false;
      setSearch(initialParams?.search);
      previousSearch.current = initialParams?.search;
    }
  }, [initialParams?.search, pathname]);
  useEffect(() => {
    if (debouncedSearch !== previousSearch.current && shouldUpdateState.current) {
      if (handleChange) {
        handleChange(debouncedSearch);
      }
      previousSearch.current = debouncedSearch;
    }
  }, [debouncedSearch, handleChange]);
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: /*#__PURE__*/_jsx("input", {
      "aria-label": label,
      className: `${baseClass}__input`,
      id: "search-filter-input",
      onChange: e => {
        shouldUpdateState.current = true;
        setSearch(e.target.value);
      },
      placeholder: label,
      type: "text",
      value: search || ''
    })
  });
};
//# sourceMappingURL=index.js.map