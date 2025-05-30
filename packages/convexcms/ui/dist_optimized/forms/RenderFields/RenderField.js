"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { ArrayField } from "../../fields/Array/index.js";
import { BlocksField } from "../../fields/Blocks/index.js";
import { CheckboxField } from "../../fields/Checkbox/index.js";
import { CodeField } from "../../fields/Code/index.js";
import { CollapsibleField } from "../../fields/Collapsible/index.js";
import { DateTimeField } from "../../fields/DateTime/index.js";
import { EmailField } from "../../fields/Email/index.js";
import { GroupField } from "../../fields/Group/index.js";
import { HiddenField } from "../../fields/Hidden/index.js";
import { JoinField } from "../../fields/Join/index.js";
import { JSONField } from "../../fields/JSON/index.js";
import { NumberField } from "../../fields/Number/index.js";
import { PointField } from "../../fields/Point/index.js";
import { RadioGroupField } from "../../fields/RadioGroup/index.js";
import { RelationshipField } from "../../fields/Relationship/index.js";
import { RichTextField } from "../../fields/RichText/index.js";
import { RowField } from "../../fields/Row/index.js";
import { SelectField } from "../../fields/Select/index.js";
import { TabsField } from "../../fields/Tabs/index.js";
import { TextField } from "../../fields/Text/index.js";
import { TextareaField } from "../../fields/Textarea/index.js";
import { UIField } from "../../fields/UI/index.js";
import { UploadField } from "../../fields/Upload/index.js";
import { useFormFields } from "../../forms/Form/index.js";
export function RenderField({
  clientFieldConfig,
  forceRender,
  indexPath,
  parentPath,
  parentSchemaPath,
  path,
  permissions,
  readOnly,
  schemaPath
}) {
  const CustomField = useFormFields(([fields]) => fields && fields?.[path]?.customComponents?.Field);
  if (CustomField !== undefined) {
    return CustomField || null;
  }
  const baseFieldProps = {
    forceRender,
    permissions,
    readOnly,
    schemaPath
  };
  const iterableFieldProps = {
    ...baseFieldProps,
    indexPath,
    parentPath,
    parentSchemaPath
  };
  if (clientFieldConfig.admin?.hidden) {
    return /*#__PURE__*/_jsx(HiddenField, {
      ...baseFieldProps,
      path: path
    });
  }
  switch (clientFieldConfig.type) {
    case "array":
      return /*#__PURE__*/_jsx(ArrayField, {
        ...iterableFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "blocks":
      return /*#__PURE__*/_jsx(BlocksField, {
        ...iterableFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "checkbox":
      return /*#__PURE__*/_jsx(CheckboxField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "code":
      return /*#__PURE__*/_jsx(CodeField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "collapsible":
      return /*#__PURE__*/_jsx(CollapsibleField, {
        ...iterableFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "date":
      return /*#__PURE__*/_jsx(DateTimeField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "email":
      return /*#__PURE__*/_jsx(EmailField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "group":
      return /*#__PURE__*/_jsx(GroupField, {
        ...iterableFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "join":
      return /*#__PURE__*/_jsx(JoinField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "json":
      return /*#__PURE__*/_jsx(JSONField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "number":
      return /*#__PURE__*/_jsx(NumberField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "point":
      return /*#__PURE__*/_jsx(PointField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "radio":
      return /*#__PURE__*/_jsx(RadioGroupField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "relationship":
      return /*#__PURE__*/_jsx(RelationshipField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "richText":
      return /*#__PURE__*/_jsx(RichTextField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "row":
      return /*#__PURE__*/_jsx(RowField, {
        ...iterableFieldProps,
        field: clientFieldConfig
      });
    case "select":
      return /*#__PURE__*/_jsx(SelectField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "tabs":
      return /*#__PURE__*/_jsx(TabsField, {
        ...iterableFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "text":
      return /*#__PURE__*/_jsx(TextField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "textarea":
      return /*#__PURE__*/_jsx(TextareaField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
    case "ui":
      return /*#__PURE__*/_jsx(UIField, {});
    case "upload":
      return /*#__PURE__*/_jsx(UploadField, {
        ...baseFieldProps,
        field: clientFieldConfig,
        path: path
      });
  }
}
//# sourceMappingURL=RenderField.js.map