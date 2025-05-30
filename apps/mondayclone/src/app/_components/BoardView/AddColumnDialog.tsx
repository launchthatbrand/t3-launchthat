"use client";

import React, { useState } from "react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { ColumnType } from "../../../types/board";

interface AddColumnDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddColumn: (name: string, type: ColumnType) => void;
}

const AddColumnDialog: React.FC<AddColumnDialogProps> = ({
  isOpen,
  onOpenChange,
  onAddColumn,
}) => {
  const [columnName, setColumnName] = useState("");
  const [columnType, setColumnType] = useState<ColumnType>(ColumnType.Text);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!columnName.trim()) return;
    onAddColumn(columnName, columnType);
    setColumnName("");
    setColumnType(ColumnType.Text); // Reset to default
    onOpenChange(false); // Close dialog
  };

  // Exclude Name and Status as they are special and typically not added manually like this
  // Name is inherent to an item, Status has complex default options handled elsewhere
  const availableColumnTypes = Object.values(ColumnType).filter(
    (type) => type !== ColumnType.Name && type !== ColumnType.Status,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Column</DialogTitle>
          <DialogDescription>
            Choose a name and type for your new column.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="column-name" className="text-right">
              Name
            </Label>
            <Input
              id="column-name"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Due Date, Priority"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="column-type" className="text-right">
              Type
            </Label>
            <Select
              value={columnType}
              onValueChange={(value: string) =>
                setColumnType(value as ColumnType)
              }
            >
              <SelectTrigger id="column-type" className="col-span-3">
                <SelectValue placeholder="Select column type" />
              </SelectTrigger>
              <SelectContent>
                {availableColumnTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {/* Capitalize first letter for display */}
                    {type.charAt(0).toUpperCase() +
                      type.slice(1).replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Column</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddColumnDialog;
