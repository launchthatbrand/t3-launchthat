"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { CodeEditor } from "../../elements/CodeEditor/index.js";
import { RenderCustomComponent } from "../../elements/RenderCustomComponent/index.js";
import { useField } from "../../forms/useField/index.js";
import { withCondition } from "../../forms/withCondition/index.js";
import { FieldDescription } from "../FieldDescription/index.js";
import { FieldError } from "../FieldError/index.js";
import { FieldLabel } from "../FieldLabel/index.js";
import { mergeFieldStyles } from "../mergeFieldStyles.js";
import { fieldBaseClass } from "../shared/index.js";
import "./index.scss";
const baseClass = "json-field";
const JSONFieldComponent = props => {
  const {
    field,
    field: {
      admin: {
        className,
        description,
        editorOptions,
        maxHeight
      } = {},
      jsonSchema,
      label,
      localized,
      required
    },
    path,
    readOnly,
    validate
  } = props;
  const [jsonError, setJsonError] = useState();
  const inputChangeFromRef = React.useRef("system");
  const [editorKey, setEditorKey] = useState("");
  const memoizedValidate = useCallback((value, options) => {
    if (typeof validate === "function") {
      return validate(value, {
        ...options,
        jsonError,
        required
      });
    }
  }, [validate, required, jsonError]);
  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Error,
      Label
    } = {},
    disabled,
    initialValue,
    setValue,
    showError,
    value
  } = useField({
    path,
    validate: memoizedValidate
  });
  const [initialStringValue, setInitialStringValue] = useState(() => (value || initialValue) !== undefined ? JSON.stringify(value ?? initialValue, null, 2) : undefined);
  const handleMount = useCallback((editor, monaco) => {
    if (!jsonSchema) {
      return;
    }
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      enableSchemaRequest: true,
      schemas: [...(monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas || []), jsonSchema],
      validate: true
    });
    const uri = jsonSchema.uri;
    const newUri = uri.includes("?") ? `${uri}&${crypto.randomUUID ? crypto.randomUUID() : uuidv4()}` : `${uri}?${crypto.randomUUID ? crypto.randomUUID() : uuidv4()}`;
    editor.setModel(monaco.editor.createModel(JSON.stringify(value, null, 2), "json", monaco.Uri.parse(newUri)));
  }, [jsonSchema, value]);
  const handleChange = useCallback(val => {
    if (readOnly || disabled) {
      return;
    }
    inputChangeFromRef.current = "user";
    try {
      setValue(val ? JSON.parse(val) : null);
      setJsonError(undefined);
    } catch (e) {
      setValue(val ? val : null);
      setJsonError(e);
    }
  }, [readOnly, disabled, setValue]);
  useEffect(() => {
    if (inputChangeFromRef.current === "system") {
      setInitialStringValue((value || initialValue) !== undefined ? JSON.stringify(value ?? initialValue, null, 2) : undefined);
      setEditorKey(new Date().toString());
    }
    inputChangeFromRef.current = "system";
  }, [initialValue, value]);
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, className, showError && "error", (readOnly || disabled) && "read-only"].filter(Boolean).join(" "),
    style: styles,
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Label,
      Fallback: /*#__PURE__*/_jsx(FieldLabel, {
        label: label,
        localized: localized,
        path: path,
        required: required
      })
    }), /*#__PURE__*/_jsxs("div", {
      className: `${fieldBaseClass}__wrap`,
      children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Error,
        Fallback: /*#__PURE__*/_jsx(FieldError, {
          message: jsonError,
          path: path,
          showError: showError
        })
      }), BeforeInput, /*#__PURE__*/_jsx(CodeEditor, {
        defaultLanguage: "json",
        maxHeight: maxHeight,
        onChange: handleChange,
        onMount: handleMount,
        options: editorOptions,
        readOnly: readOnly || disabled,
        value: initialStringValue,
        wrapperProps: {
          id: `field-${path?.replace(/\./g, "__")}`
        }
      }, editorKey), AfterInput]
    }), /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Description,
      Fallback: /*#__PURE__*/_jsx(FieldDescription, {
        description: description,
        path: path
      })
    })]
  });
};
export const JSONField = withCondition(JSONFieldComponent);
//# sourceMappingURL=index.js.map