'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import EditorImport from '@monaco-editor/react';
import React, { useState } from 'react';
import { useTheme } from '../../providers/Theme/index.js';
import { ShimmerEffect } from '../ShimmerEffect/index.js';
import './index.scss';
const Editor = EditorImport.default || EditorImport;
const baseClass = 'code-editor';
const CodeEditor = props => {
  const $ = _c(26);
  let className;
  let maxHeight;
  let minHeight;
  let options;
  let readOnly;
  let rest;
  if ($[0] !== props) {
    ({
      className,
      maxHeight,
      minHeight,
      options,
      readOnly,
      ...rest
    } = props);
    $[0] = props;
    $[1] = className;
    $[2] = maxHeight;
    $[3] = minHeight;
    $[4] = options;
    $[5] = readOnly;
    $[6] = rest;
  } else {
    className = $[1];
    maxHeight = $[2];
    minHeight = $[3];
    options = $[4];
    readOnly = $[5];
    rest = $[6];
  }
  const MIN_HEIGHT = minHeight ?? 56;
  const paddingFromProps = options?.padding ? (options.padding.top || 0) + (options.padding?.bottom || 0) : 0;
  const [dynamicHeight, setDynamicHeight] = useState(MIN_HEIGHT);
  const {
    theme
  } = useTheme();
  const t0 = rest?.defaultLanguage ? `language--${rest.defaultLanguage}` : "";
  const t1 = readOnly && "read-only";
  let t2;
  if ($[7] !== className || $[8] !== t0 || $[9] !== t1) {
    t2 = [baseClass, className, t0, t1].filter(Boolean);
    $[7] = className;
    $[8] = t0;
    $[9] = t1;
    $[10] = t2;
  } else {
    t2 = $[10];
  }
  const classes = t2.join(" ");
  let t3;
  if ($[11] !== MIN_HEIGHT || $[12] !== classes || $[13] !== dynamicHeight || $[14] !== maxHeight || $[15] !== options || $[16] !== paddingFromProps || $[17] !== readOnly || $[18] !== rest || $[19] !== theme) {
    let t4;
    let t5;
    if ($[21] !== MIN_HEIGHT || $[22] !== paddingFromProps || $[23] !== rest) {
      t4 = (value, ev) => {
        rest.onChange?.(value, ev);
        setDynamicHeight(Math.max(MIN_HEIGHT, value.split("\n").length * 18 + 2 + paddingFromProps));
      };
      t5 = (editor, monaco) => {
        rest.onMount?.(editor, monaco);
        setDynamicHeight(Math.max(MIN_HEIGHT, editor.getValue().split("\n").length * 18 + 2 + paddingFromProps));
      };
      $[21] = MIN_HEIGHT;
      $[22] = paddingFromProps;
      $[23] = rest;
      $[24] = t4;
      $[25] = t5;
    } else {
      t4 = $[24];
      t5 = $[25];
    }
    t3 = _jsx(Editor, {
      className: classes,
      loading: _jsx(ShimmerEffect, {
        height: dynamicHeight
      }),
      options: {
        detectIndentation: true,
        hideCursorInOverviewRuler: true,
        minimap: {
          enabled: false
        },
        overviewRulerBorder: false,
        readOnly: Boolean(readOnly),
        scrollbar: {
          alwaysConsumeMouseWheel: false
        },
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: "on",
        ...options
      },
      theme: theme === "dark" ? "vs-dark" : "vs",
      ...rest,
      height: maxHeight ? Math.min(dynamicHeight, maxHeight) : dynamicHeight,
      onChange: t4,
      onMount: t5
    });
    $[11] = MIN_HEIGHT;
    $[12] = classes;
    $[13] = dynamicHeight;
    $[14] = maxHeight;
    $[15] = options;
    $[16] = paddingFromProps;
    $[17] = readOnly;
    $[18] = rest;
    $[19] = theme;
    $[20] = t3;
  } else {
    t3 = $[20];
  }
  return t3;
};
// eslint-disable-next-line no-restricted-exports
export default CodeEditor;
//# sourceMappingURL=CodeEditor.js.map