"use client";

import { useState } from "react";
import { TrashIcon } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import type {
  Column,
  DropdownOption,
  StatusOption,
} from "../../../types/board";
import { ColumnType } from "../../../types/board";
import { GROUP_COLORS } from "./constants";
import { getGroupColorProps } from "./utils";

// Add Group Dialog
interface AddGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddGroup: (name: string, color: string) => void;
}

export const AddGroupDialog = ({
  isOpen,
  onOpenChange,
  onAddGroup,
}: AddGroupDialogProps) => {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState<string>(
    GROUP_COLORS[0]?.value ?? "blue",
  );
  const [addError, setAddError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setAddError("Group name is required");
      return;
    }
    setAddError("");
    onAddGroup(newGroupName, newGroupColor);
    setNewGroupName("");
    setNewGroupColor(GROUP_COLORS[0]?.value ?? "blue");
    onOpenChange(false); // Close dialog on successful add
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Trigger is handled by parent component */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            autoFocus
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium">Color</label>
            <div className="flex gap-2">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2",
                    newGroupColor === c.value
                      ? "border-black dark:border-white"
                      : "border-transparent",
                  )}
                  style={{
                    backgroundColor: getGroupColorProps(c.value).style
                      .backgroundColor,
                  }}
                  aria-label={c.name}
                  onClick={() => setNewGroupColor(c.value)}
                >
                  {newGroupColor === c.value && (
                    <span className="block h-2 w-2 rounded-full bg-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
          {addError && (
            <div className="text-sm text-destructive">{addError}</div>
          )}
          <DialogFooter>
            <Button type="submit" variant="primary">
              Create
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Add Column Dialog
interface AddColumnDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddColumn: (name: string, type: ColumnType) => void;
}

export const AddColumnDialog = ({
  isOpen,
  onOpenChange,
  onAddColumn,
}: AddColumnDialogProps) => {
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState<ColumnType>(ColumnType.Text);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) {
      return;
    }
    onAddColumn(newColName, newColType);
    setNewColName("");
    setNewColType(ColumnType.Text);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Column</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            autoFocus
            placeholder="Column name"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select
              className="w-full rounded border px-2 py-1"
              value={newColType}
              onChange={(e) => setNewColType(e.target.value as ColumnType)}
            >
              {Object.values(ColumnType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" variant="primary">
              Create
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Dialog
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  targetName: string;
  targetType: "board" | "group" | "item" | "column";
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationDialog = ({
  isOpen,
  targetName,
  targetType,
  onCancel,
  onConfirm,
}: DeleteConfirmationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <TrashIcon className="h-5 w-5" />
            Delete {targetType}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold">{targetName}</span>?
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          This action cannot be undone. This will permanently delete this{" "}
          {targetType}, including all of its data.
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ColumnConfigDialogProps {
  isOpen: boolean;
  column: Column;
  onCancel: () => void;
  onSave: (column: Column) => void;
}

export const ColumnConfigDialog = ({
  isOpen,
  column,
  onCancel,
  onSave,
}: ColumnConfigDialogProps) => {
  // Initialize options from column.config, or create empty defaults
  const [options, setOptions] = useState<StatusOption[] | DropdownOption[]>(
    () => {
      if (
        column.type === ColumnType.Status &&
        column.config?.type === ColumnType.Status
      ) {
        return [...(column.config.options as StatusOption[])];
      } else if (
        column.type === ColumnType.Dropdown &&
        column.config?.type === ColumnType.Dropdown
      ) {
        return [...(column.config.options as DropdownOption[])];
      }
      return [];
    },
  );

  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionColor, setNewOptionColor] = useState("#4f46e5"); // Default indigo color

  const addOption = () => {
    if (!newOptionLabel.trim()) return;

    const newOption = {
      id: Date.now().toString(),
      label: newOptionLabel.trim(),
      color: newOptionColor,
    };

    setOptions([...options, newOption]);
    setNewOptionLabel("");
  };

  const removeOption = (id: string) => {
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const handleSave = () => {
    const newConfig = {
      type: column.type,
      options: options,
    };

    onSave({
      ...column,
      config: newConfig,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure {column.name}</DialogTitle>
          <DialogDescription>
            {column.type === ColumnType.Status &&
              "Configure status options for this column."}
            {column.type === ColumnType.Dropdown &&
              "Configure dropdown options for this column."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-[1fr,auto] gap-2">
            <Label htmlFor="new-option" className="mb-2">
              Options
            </Label>
          </div>

          {/* List existing options */}
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((option) => (
              <div key={option.id} className="mb-2 flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                <span className="flex-1">{option.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                  onClick={() => removeOption(option.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add new option form */}
          <div className="grid grid-cols-[1fr,auto,auto] gap-2">
            <Input
              id="new-option"
              value={newOptionLabel}
              onChange={(e) => setNewOptionLabel(e.target.value)}
              placeholder="Add new option..."
              className="h-8 text-sm"
            />
            <Input
              type="color"
              value={newOptionColor}
              onChange={(e) => setNewOptionColor(e.target.value)}
              className="h-8 w-10 p-1"
              aria-label="Option color"
            />
            <Button
              type="button"
              size="sm"
              className="h-8"
              onClick={addOption}
              disabled={!newOptionLabel.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
