'use client';

import { c as _c } from "react/compiler-runtime";
import * as qs from 'qs-esm';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../providers/Locale/index.js';
import { useTranslation } from '../providers/Translation/index.js';
import { requests } from '../utilities/api.js';
export const usePayloadAPI = (url, t0) => {
  const $ = _c(32);
  let t1;
  if ($[0] !== t0) {
    t1 = t0 === undefined ? {} : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const options = t1;
  const {
    initialData,
    initialParams: t2
  } = options;
  let t3;
  if ($[2] !== t2) {
    t3 = t2 === undefined ? {} : t2;
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const initialParams = t3;
  const {
    i18n
  } = useTranslation();
  let t4;
  if ($[4] !== initialData) {
    t4 = initialData || {};
    $[4] = initialData;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  const [data, setData] = useState(t4);
  const [params, setParams] = useState(initialParams);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isError, setIsError] = useState(false);
  const {
    code: locale
  } = useLocale();
  const hasInitialized = useRef(false);
  let t5;
  if ($[6] !== locale || $[7] !== params) {
    let t6;
    if ($[9] !== params) {
      t6 = typeof params === "object" ? params : {};
      $[9] = params;
      $[10] = t6;
    } else {
      t6 = $[10];
    }
    t5 = qs.stringify({
      locale,
      ...t6
    }, {
      addQueryPrefix: true
    });
    $[6] = locale;
    $[7] = params;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  const search = t5;
  let t6;
  if ($[11] !== i18n.language || $[12] !== initialData || $[13] !== search || $[14] !== url) {
    t6 = () => {
      if (initialData && !hasInitialized.current) {
        hasInitialized.current = true;
        return;
      }
      const abortController = new AbortController();
      const fetchData = async () => {
        setIsError(false);
        setIsLoading(true);
        ;
        try {
          const response = await requests.get(`${url}${search}`, {
            headers: {
              "Accept-Language": i18n.language
            },
            signal: abortController.signal
          });
          if (response.status > 201) {
            setIsError(true);
          }
          const json = await response.json();
          setData(json);
          setIsLoading(false);
        } catch (t7) {
          if (!abortController.signal.aborted) {
            setIsError(true);
            setIsLoading(false);
          }
        }
      };
      if (url) {
        fetchData();
      } else {
        setIsError(false);
        setIsLoading(false);
      }
      return () => {
        ;
        try {
          abortController.abort();
        } catch (t8) {
          const _err = t8;
        }
      };
    };
    $[11] = i18n.language;
    $[12] = initialData;
    $[13] = search;
    $[14] = url;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  let t7;
  if ($[16] !== i18n.language || $[17] !== initialData || $[18] !== locale || $[19] !== search || $[20] !== url) {
    t7 = [url, locale, search, i18n.language, initialData];
    $[16] = i18n.language;
    $[17] = initialData;
    $[18] = locale;
    $[19] = search;
    $[20] = url;
    $[21] = t7;
  } else {
    t7 = $[21];
  }
  useEffect(t6, t7);
  let t8;
  let t9;
  if ($[22] !== initialData) {
    t8 = () => {
      if (initialData && hasInitialized.current) {
        setData(initialData);
      }
    };
    t9 = [initialData];
    $[22] = initialData;
    $[23] = t8;
    $[24] = t9;
  } else {
    t8 = $[23];
    t9 = $[24];
  }
  useEffect(t8, t9);
  let t10;
  if ($[25] !== data || $[26] !== isError || $[27] !== isLoading) {
    t10 = {
      data,
      isError,
      isLoading
    };
    $[25] = data;
    $[26] = isError;
    $[27] = isLoading;
    $[28] = t10;
  } else {
    t10 = $[28];
  }
  let t11;
  if ($[29] === Symbol.for("react.memo_cache_sentinel")) {
    t11 = {
      setParams
    };
    $[29] = t11;
  } else {
    t11 = $[29];
  }
  let t12;
  if ($[30] !== t10) {
    t12 = [t10, t11];
    $[30] = t10;
    $[31] = t12;
  } else {
    t12 = $[31];
  }
  return t12;
};
//# sourceMappingURL=usePayloadAPI.js.map