import type { ColumnDef, Row, SortingState } from "@tanstack/react-table";
import * as React from "react";
import { Id } from "@convex-config/_generated/dataModel";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { GripVertical } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { useReorderTasks } from "../_api/tasks";
import { EntityList } from "@acme/ui/entity-list/EntityList";

// Drag handle for the first column
function DragHandle() {
  return (
    <span className="cursor-grab text-muted-foreground hover:text-foreground">
      <GripVertical className="h-4 w-4" />
    </span>
  );
}

// Sortable row wrapper for DnDKit
function SortableRow<T extends { _id: string }>({
  row,
  children,
}: {
  row: Row<T>;
  children: React.ReactNode;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.original._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <TableRow ref={setNodeRef} style={style} key={row.id}>
      <TableCell className="w-8">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground"
        >
          <DragHandle />
        </span>
      </TableCell>
      {children}
    </TableRow>
  );
}

// Main TasksTable component
export function TasksTable<T extends { _id: string }>({
  tasks,
  columns,
  onAddTask,
}: {
  tasks: T[];
  columns: ColumnDef<T, any>[];
  onAddTask?: () => void;
}) {
  // DnD row order state (array of _id)
  const [rowOrder, setRowOrder] = React.useState(tasks.map((t) => t._id));
  const reorderTasks = useReorderTasks();

  // Reset rowOrder when tasks change
  React.useEffect(() => {
    setRowOrder(tasks.map((t) => t._id));
  }, [tasks]);

  // Table sorting state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // DnDKit sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // Handle drag end: update order locally and persist to Convex
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIndex = rowOrder.indexOf(activeId);
    const newIndex = rowOrder.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(rowOrder, oldIndex, newIndex);
    setRowOrder(newOrder);
    // Persist new order to Convex
    await reorderTasks({
      tasks: newOrder.map((id, idx) => ({
        taskId: id as Id<"tasks">,
        sortIndex: idx,
      })),
    });
  };

  // Map rowOrder to table rows for DnD
  const orderedRows = rowOrder
    .map((id) =>
      table.getRowModel().rows.find((row) => row.original._id === id),
    )
    .filter((row): row is Row<T> => Boolean(row));

  const tableContent = (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={rowOrder} strategy={verticalListSortingStrategy}>
        <div className="w-full rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <TableHead className="w-8" />
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {orderedRows.length ? (
                <>
                  {orderedRows.map((row) => (
                    <SortableRow key={row.id} row={row}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </SortableRow>
                  ))}
                  <TableRow
                    className="cursor-pointer hover:bg-muted"
                    onClick={onAddTask}
                    tabIndex={0}
                    aria-label="Add Task"
                  >
                    <TableCell
                      colSpan={columns.length + 1}
                      className="text-center font-medium text-primary"
                    >
                      + Add Task
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SortableContext>
    </DndContext>
  );

  return (
    <EntityList
      data={tasks}
      columns={columns}
      enableSearch={false}
      enableFooter={false}
      hideFilters
      viewModes={["list"]}
      defaultViewMode="list"
      customRender={() => tableContent}
    />
  );
}
