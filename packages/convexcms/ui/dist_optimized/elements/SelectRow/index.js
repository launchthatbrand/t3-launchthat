"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { CheckboxInput } from "../../fields/Checkbox/Input.js";
import { useAuth } from "../../providers/Auth/index.js";
import { useSelection } from "../../providers/Selection/index.js";
import { Locked } from "../Locked/index.js";
const baseClass = "select-row";
export const SelectRow = ({
  rowData
}) => {
  const {
    user
  } = useAuth();
  const {
    selected,
    setSelection
  } = useSelection();
  const {
    _isLocked,
    _userEditing
  } = rowData || {};
  const documentIsLocked = _isLocked && _userEditing;
  if (documentIsLocked && _userEditing.id !== user?.id) {
    return /*#__PURE__*/_jsx(Locked, {
      user: _userEditing
    });
  }
  return /*#__PURE__*/_jsx(CheckboxInput, {
    checked: Boolean(selected.get(rowData.id)),
    className: [baseClass, `${baseClass}__checkbox`].join(" "),
    onToggle: () => setSelection(rowData.id)
  });
};
//# sourceMappingURL=index.js.map