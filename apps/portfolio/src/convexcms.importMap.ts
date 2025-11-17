// This file is generated automatically. Do not edit.
/* eslint-disable */

import { CollectionSettingsPage } from "@convexcms/ui/components/views/CollectionSettingsPage";
// View Imports
import { DashboardView } from "@convexcms/ui/components/views/DashboardView";
import { EditView } from "@convexcms/ui/components/views/EditView";
import { ListView } from "@convexcms/ui/components/views/ListView";
import { NotFoundView } from "@convexcms/ui/components/views/NotFoundView";
import { CheckboxField } from "@convexcms/ui/fields/CheckboxField";
import { NumberField } from "@convexcms/ui/fields/NumberField";
// Field Imports
import { TextField } from "@convexcms/ui/fields/TextField";
import { UnknownField } from "@convexcms/ui/fields/UnknownField";

export const importMap = {
  views: {
    Dashboard: DashboardView,
    CollectionList: ListView,
    CollectionEdit: EditView,
    CollectionCreate: EditView,
    CollectionSettings: CollectionSettingsPage,
    NotFound: NotFoundView,
  },
  fields: {
    string: TextField,
    boolean: CheckboxField,
    number: NumberField,
    unknown: UnknownField,
  },
};
