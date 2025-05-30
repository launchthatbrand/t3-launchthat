"use client";

import {
  AtSignIcon,
  CalendarIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  CircleDotIcon,
  HashIcon,
  LinkIcon,
  PhoneIcon,
  PilcrowIcon,
  TextIcon,
  TypeIcon,
  UserCircle2Icon,
} from "lucide-react";

import { ColumnType } from "../../../types/board";
import type { LucideIcon } from "lucide-react";
import React from "react";

interface ColumnTypeIconProps {
  type: ColumnType;
  className?: string;
}

const ColumnTypeIcon: React.FC<ColumnTypeIconProps> = ({ type, className }) => {
  let IconComponent: LucideIcon = TypeIcon; // Default icon

  switch (type) {
    case ColumnType.Text:
      IconComponent = TextIcon;
      break;
    case ColumnType.LongText:
      IconComponent = PilcrowIcon;
      break;
    case ColumnType.Number:
      IconComponent = HashIcon;
      break;
    case ColumnType.Date:
      IconComponent = CalendarIcon;
      break;
    case ColumnType.User:
      IconComponent = UserCircle2Icon;
      break;
    case ColumnType.Status:
      IconComponent = CircleDotIcon;
      break;
    case ColumnType.Checkbox:
      IconComponent = CheckSquareIcon;
      break;
    case ColumnType.Link:
      IconComponent = LinkIcon;
      break;
    case ColumnType.Email:
      IconComponent = AtSignIcon;
      break;
    case ColumnType.Phone:
      IconComponent = PhoneIcon;
      break;
    case ColumnType.Dropdown:
      IconComponent = ChevronDownIcon;
      break;
    case ColumnType.Name: // Name is often special, but can default to a general text/type icon
      IconComponent = TypeIcon;
      break;
    // Add other cases if ColumnType expands.
    // For now, any unhandled type will use the default TypeIcon.
    default:
      // This handles any future ColumnTypes not explicitly listed or if a new one is added
      // and not yet mapped. Using TypeIcon as a sensible default.
      IconComponent = TypeIcon;
      break;
  }

  return <IconComponent className={className} />;
};

export default ColumnTypeIcon;
