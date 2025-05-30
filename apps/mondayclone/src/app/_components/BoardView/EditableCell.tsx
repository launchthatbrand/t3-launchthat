"use client";

import React from "react";
import { Paperclip, UserCircle2 } from "lucide-react";

import { cn } from "@acme/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import type {
  Column,
  DropdownOption,
  Item,
  StatusOption,
  User,
} from "../../../types/board";
import { ColumnType } from "../../../types/board";
import { PLACEHOLDER_USERS } from "./constants";

interface EditableCellProps {
  item: Item;
  column: Column;
  isEditing: boolean;
  value: unknown;
  onChange: (colId: string, value: unknown) => void;
  onSave: (item: Item) => void;
  onCancel: () => void;
  onKeyDown: (
    e: React.KeyboardEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    item: Item,
    columnIdOrder: string[],
    currentColumnIndex: number,
  ) => void;
  inputRef?: (
    el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null,
  ) => void;
  boardColumns: Column[];
}

const EditableCell: React.FC<EditableCellProps> = ({
  item,
  column,
  isEditing,
  value,
  onChange,
  onSave,
  onKeyDown,
  inputRef,
  boardColumns,
}) => {
  const currentColumnIndex = boardColumns.findIndex((c) => c.id === column.id);
  const columnIdOrder = boardColumns.map((c) => c.id);

  if (!isEditing) {
    if (column.type === ColumnType.Name) {
      return (
        <span className="block truncate font-medium text-gray-800 group-hover/itemrow:text-blue-600 dark:text-gray-100 dark:group-hover/itemrow:text-blue-400">
          {item.name}
        </span>
      );
    }
    if (column.type === ColumnType.Checkbox) {
      return (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={!!value}
            readOnly
            disabled
            className="h-3.5 w-3.5 cursor-default rounded-sm border-gray-300 bg-white text-blue-500 focus:ring-blue-400 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
      );
    }
    if (column.type === ColumnType.User) {
      const user = PLACEHOLDER_USERS.find((u: User) => u.id === value);
      return (
        <div className="flex items-center justify-center">
          {user ? (
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: user.color ?? "#cccccc" }}
            >
              <span className="text-xs font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <button className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 dark:border-zinc-600 dark:hover:border-zinc-500">
              <UserCircle2 className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            </button>
          )}
        </div>
      );
    }
    if (column.type === ColumnType.Status) {
      if (column.config?.type === ColumnType.Status) {
        const statusConfig = column.config as {
          type: ColumnType.Status;
          options: StatusOption[];
        };
        const selectedOption = statusConfig.options.find(
          (opt: StatusOption) => opt.id === value,
        );
        if (selectedOption) {
          return (
            <div
              className="flex h-full w-full items-center justify-center rounded px-2 py-1 text-xs font-medium text-white antialiased"
              style={{
                backgroundColor: selectedOption.color,
                minHeight: "28px",
              }}
            >
              {selectedOption.label}
            </div>
          );
        }
      }
      return (
        <div className="flex h-full min-h-[28px] w-full items-center justify-center rounded border-2 border-dashed border-gray-200 bg-gray-50/50 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800/30 dark:hover:border-zinc-600"></div>
      );
    }
    if (column.type === ColumnType.Dropdown) {
      if (column.config?.type === ColumnType.Dropdown) {
        const dropdownConfig = column.config as {
          type: ColumnType.Dropdown;
          options: DropdownOption[];
        };

        // Find the selected option
        const selectedOption = dropdownConfig.options.find(
          (opt) => opt.id === value,
        );

        // Debug
        console.log("Dropdown view options:", dropdownConfig.options);
        const stringValue = typeof value === "string" ? value : "";
        console.log("Current dropdown value:", stringValue || "none");
        console.log(
          "Selected option:",
          selectedOption ? selectedOption.label : "none",
        );

        // When not editing, show the selected value or a dash
        if (selectedOption) {
          return (
            <div className="flex items-center gap-1.5 px-1 py-0.5 text-xs text-gray-700 dark:text-gray-300">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedOption.color }}
              />
              <span>{selectedOption.label}</span>
            </div>
          );
        }

        return (
          <span className="block truncate text-xs text-gray-400 dark:text-gray-500">
            -
          </span>
        );
      }
      return (
        <span className="block truncate text-xs text-gray-400 dark:text-gray-500">
          -
        </span>
      );
    }
    if (column.type === ColumnType.Date) {
      if (typeof value === "string" && value) {
        try {
          const date = new Date(value + "T00:00:00");
          return (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {date.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          );
        } catch {
          return (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {value}
            </span>
          );
        }
      }
      return (
        <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
      );
    }
    if (
      column.type === ColumnType.Link ||
      column.name.toLowerCase().includes("doc")
    ) {
      if (typeof value === "string" && value.trim() && value !== "-") {
        const isUrl =
          value.startsWith("http://") || value.startsWith("https://");
        const displayValue = isUrl
          ? new URL(value).hostname.replace(/^www\./, "")
          : value;
        return (
          <a
            href={isUrl ? value : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1 text-xs hover:underline",
              isUrl
                ? "text-blue-500 hover:text-blue-600 dark:text-blue-400"
                : "cursor-default text-gray-500 no-underline dark:text-gray-400",
            )}
            onClick={(e) => {
              if (!isUrl) e.preventDefault();
            }}
            title={value}
          >
            <Paperclip className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{displayValue}</span>
          </a>
        );
      }
      return (
        <div className="flex items-center justify-center">
          <button className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 dark:border-zinc-600 dark:hover:border-zinc-500">
            <Paperclip className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          </button>
        </div>
      );
    }
    return (
      <span className="block truncate text-xs text-gray-600 dark:text-gray-400">
        {typeof value === "string" || typeof value === "number"
          ? String(value)
          : "-"}
      </span>
    );
  }

  const propName = column.id as keyof Item;
  const rawValue = item[propName];
  const editValue =
    column.type === ColumnType.Name
      ? item.name
      : typeof rawValue === "string" || typeof rawValue === "number"
        ? String(rawValue)
        : "";

  const commonInputProps = {
    value: editValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange(column.id, e.target.value),
    onBlur: () => onSave(item),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) =>
      onKeyDown(e, item, columnIdOrder, currentColumnIndex),
    ref: inputRef as (el: HTMLInputElement | HTMLSelectElement | null) => void,
    className:
      "w-full rounded-sm border-blue-500 bg-white px-1.5 py-1 text-xs shadow-sm outline-none ring-1 ring-blue-500 focus:ring-2 dark:bg-zinc-700 dark:text-white dark:border-blue-400 dark:ring-blue-400",
    autoFocus: true,
    tabIndex: 0,
    "aria-label": `Edit ${column.name}`,
  };

  const commonTextAreaProps = {
    ...commonInputProps,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onChange(column.id, e.target.value),
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) =>
      onKeyDown(e, item, columnIdOrder, currentColumnIndex),
    ref: inputRef as (el: HTMLTextAreaElement | null) => void,
    className: commonInputProps.className + " resize-none min-h-[40px]",
    rows: 2,
    autoFocus: true,
    tabIndex: 0,
    "aria-label": `Edit ${column.name}`,
  };

  switch (column.type) {
    case ColumnType.Name:
      return (
        <input
          type="text"
          {...commonInputProps}
          value={item.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      );
    case ColumnType.Text:
    case ColumnType.Number: {
      const inputType = column.type === ColumnType.Number ? "number" : "text";
      return <input type={inputType} {...commonInputProps} />;
    }
    case ColumnType.LongText: {
      return <textarea {...commonTextAreaProps} />;
    }
    case ColumnType.Email: {
      return <input type="email" {...commonInputProps} />;
    }
    case ColumnType.Phone: {
      return <input type="tel" {...commonInputProps} />;
    }
    case ColumnType.Date: {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const dateValue =
        typeof editValue === "string" && dateRegex.test(editValue)
          ? editValue
          : "";
      return <input type="date" {...commonInputProps} value={dateValue} />;
    }
    case ColumnType.User: {
      return (
        <select {...commonInputProps}>
          <option value="">-</option>
          {PLACEHOLDER_USERS.map((user: User) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      );
    }
    case ColumnType.Dropdown: {
      if (column.config?.type === ColumnType.Dropdown) {
        const dropdownConfig = column.config as {
          type: ColumnType.Dropdown;
          options: DropdownOption[];
        };

        console.log("Dropdown edit options:", dropdownConfig.options);
        const stringifiedValue = typeof value === "string" ? value : "";
        console.log("Current dropdown value:", stringifiedValue || "none");

        return (
          <div className="py-0.5">
            <Select
              defaultValue={typeof value === "string" ? value : ""}
              onValueChange={(val) => {
                console.log("Selected dropdown value:", val);
                onChange(column.id, val);
              }}
              onOpenChange={(open) => {
                if (!open) {
                  console.log("Saving after dropdown selection");
                  onSave(item);
                }
              }}
            >
              <SelectTrigger
                className="h-7 w-full border-blue-500 bg-white text-xs outline-none ring-1 ring-blue-500 focus:ring-2 dark:border-blue-400 dark:bg-zinc-700 dark:text-white dark:ring-blue-400"
                autoFocus
              >
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-</SelectItem>
                {dropdownConfig.options.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: opt.color }}
                      />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }
      return (
        <input
          type="text"
          {...commonInputProps}
          placeholder="Invalid dropdown config"
          disabled
        />
      );
    }
    case ColumnType.Status: {
      if (column.config?.type === ColumnType.Status) {
        const statusConfig = column.config as {
          type: ColumnType.Status;
          options: StatusOption[];
        };
        return (
          <select {...commonInputProps}>
            <option value="">-</option>
            {statusConfig.options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }
      return (
        <input
          type="text"
          {...commonInputProps}
          placeholder="Invalid status config"
          disabled
        />
      );
    }
    case ColumnType.Checkbox: {
      return (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={!!editValue}
            onChange={(e) => onChange(column.id, e.target.checked)}
            className="h-3.5 w-3.5 rounded-sm border-gray-300 text-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:focus:ring-blue-400"
            autoFocus
          />
        </div>
      );
    }
    case ColumnType.Link: {
      return (
        <input
          type="text"
          {...commonInputProps}
          placeholder="Enter URL or text"
        />
      );
    }
    default: {
      return (
        <input type="text" {...commonInputProps} value={String(editValue)} />
      );
    }
  }
};

export default EditableCell;
