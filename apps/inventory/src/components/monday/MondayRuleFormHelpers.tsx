import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Skeleton } from "@acme/ui/skeleton";

interface MondayBoardSelectorProps {
  value: string;
  onChange: (boardId: string) => void;
  integrationId: Id<"mondayIntegration">;
  label?: string;
  placeholder?: string;
}

export function MondayBoardSelector({
  value,
  onChange,
  integrationId,
  label = "Board",
  placeholder = "Select a board",
}: MondayBoardSelectorProps) {
  const boards = useQuery(api.monday.queries.getBoards, {
    integrationId,
  });

  if (!boards) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {boards.map((board) => (
            <SelectItem key={board.id} value={board.id}>
              {board.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface MondayColumnSelectorProps {
  boardId: string;
  value: string;
  onChange: (columnId: string) => void;
  integrationId: Id<"mondayIntegration">;
  label?: string;
  placeholder?: string;
  columnType?: string; // Filter by column type (e.g., "status", "date", "text")
}

export function MondayColumnSelector({
  boardId,
  value,
  onChange,
  integrationId,
  label = "Column",
  placeholder = "Select a column",
  columnType,
}: MondayColumnSelectorProps) {
  const columns = useQuery(
    api.monday.queries.getBoardColumns,
    boardId ? { integrationId, boardId } : "skip",
  );

  if (!boardId) {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium">{label}</label>}
        <Select disabled value="" onValueChange={() => {}}>
          <SelectTrigger>
            <SelectValue placeholder="Please select a board first" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (!columns) {
    return <Skeleton className="h-10 w-full" />;
  }

  // Filter columns by type if specified
  const filteredColumns = columnType
    ? columns.filter((col) => col.type === columnType)
    : columns;

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {filteredColumns.map((column) => (
            <SelectItem key={column.id} value={column.id}>
              {column.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface MondayStatusValueSelectorProps {
  boardId: string;
  columnId: string;
  value: string;
  onChange: (value: string) => void;
  integrationId: Id<"mondayIntegration">;
  label?: string;
  placeholder?: string;
}

export function MondayStatusValueSelector({
  boardId,
  columnId,
  value,
  onChange,
  integrationId,
  label = "Status Value",
  placeholder = "Select a status value",
}: MondayStatusValueSelectorProps) {
  const statusValues = useQuery(
    api.monday.queries.getColumnValues,
    boardId && columnId ? { integrationId, boardId, columnId } : "skip",
  );

  if (!boardId || !columnId) {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium">{label}</label>}
        <Select disabled value="" onValueChange={() => {}}>
          <SelectTrigger>
            <SelectValue placeholder="Please select a board and column first" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (!statusValues) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {statusValues.map((status) => (
            <SelectItem key={status.id} value={status.value}>
              {status.text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface MondayGroupSelectorProps {
  boardId: string;
  value: string;
  onChange: (groupId: string) => void;
  integrationId: Id<"mondayIntegration">;
  label?: string;
  placeholder?: string;
}

export function MondayGroupSelector({
  boardId,
  value,
  onChange,
  integrationId,
  label = "Group",
  placeholder = "Select a group",
}: MondayGroupSelectorProps) {
  const groups = useQuery(
    api.monday.queries.getBoardGroups,
    boardId ? { integrationId, boardId } : "skip",
  );

  if (!boardId) {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium">{label}</label>}
        <Select disabled value="" onValueChange={() => {}}>
          <SelectTrigger>
            <SelectValue placeholder="Please select a board first" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (!groups) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
