import { useState } from "react";
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  Hash,
  Link2,
  List,
  ListTodo,
  Mail,
  Phone,
  Plus,
  Text,
  User,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { ScrollArea } from "@acme/ui/scroll-area";

import type { Column } from "../../../types/board";
import { ColumnType } from "../../../types/board";

// Define interface for column options to handle both enum values and custom types
interface ColumnOption {
  type: ColumnType | string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const COLUMN_TYPE_OPTIONS: ColumnOption[] = [
  { type: ColumnType.Text, label: "Text", icon: Text },
  { type: ColumnType.Number, label: "Number", icon: Hash },
  { type: ColumnType.Date, label: "Date", icon: Calendar },
  { type: "People", label: "People", icon: User }, // Custom type not in enum
  { type: ColumnType.Status, label: "Status", icon: ListTodo },
  { type: ColumnType.Dropdown, label: "Dropdown", icon: List },
  { type: ColumnType.Checkbox, label: "Checkbox", icon: CheckSquare },
  { type: ColumnType.Email, label: "Email", icon: Mail },
  { type: ColumnType.Phone, label: "Phone", icon: Phone },
  { type: ColumnType.Link, label: "Link", icon: Link2 },
  // Add more as needed
];

const AddColumnCombobox = ({
  onAddColumn,
  existingColumns,
}: {
  onAddColumn: (name: string, type: ColumnType) => void;
  existingColumns: Column[];
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = COLUMN_TYPE_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  // Generate column name based on type and existing columns
  const generateColumnName = (type: ColumnType | string): string => {
    const typeLabel =
      COLUMN_TYPE_OPTIONS.find((opt) => String(opt.type) === String(type))
        ?.label ?? String(type);

    // Count existing columns of the same type
    const existingOfType = existingColumns.filter(
      (col) => String(col.type) === String(type),
    ).length;

    // Create name like "Text 1", "Phone 2", etc.
    return `${typeLabel} ${existingOfType + 1}`;
  };

  const handleSelect = (type: ColumnType) => {
    const name = generateColumnName(type);
    onAddColumn(name, type);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Add column"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="mb-2 flex items-center gap-2">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search column types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <ScrollArea className="max-h-56">
          {filteredOptions.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground">
              No types found
            </div>
          )}
          {filteredOptions.map((opt, index) => (
            <button
              key={`column-type-${opt.type}-${index}`}
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-accent focus:bg-accent"
              onClick={() => handleSelect(opt.type as ColumnType)}
              type="button"
            >
              <opt.icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{opt.label}</span>
            </button>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default AddColumnCombobox;
