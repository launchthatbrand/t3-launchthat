import type { Board, Column, Group, Item } from "../types/board";
import { DEFAULT_DROPDOWN_OPTIONS } from "../app/_components/BoardView/constants";
import { ColumnType } from "../types/board";

export function createDefaultBoardStructure(
  boardName: string,
  folderId?: string,
) {
  const boardId = crypto.randomUUID();
  const groupNames = ["Group 1", "Group 2"];
  const itemNames = ["Item 1", "Item 2", "Item 3"];

  // Create Name column
  const nameColumn: Column = {
    id: crypto.randomUUID(),
    name: "Name",
    type: ColumnType.Name,
    boardId,
  };

  // Create Status column
  const statusColumn: Column = {
    id: crypto.randomUUID(),
    name: "Status 1",
    type: ColumnType.Status,
    boardId,
    config: {
      type: ColumnType.Status,
      options: [
        { id: "status_todo", label: "To Do", color: "#c4c4c4" },
        { id: "status_working", label: "Working on it", color: "#fdab3d" },
        { id: "status_done", label: "Done", color: "#00c875" },
        { id: "status_stuck", label: "Stuck", color: "#e2445c" },
      ],
    },
  };

  // Create Dropdown columns
  const dropdown1Column: Column = {
    id: crypto.randomUUID(),
    name: "Dropdown 1",
    type: ColumnType.Dropdown,
    boardId,
    config: {
      type: ColumnType.Dropdown,
      options: DEFAULT_DROPDOWN_OPTIONS,
    },
  };

  const dropdown2Column: Column = {
    id: crypto.randomUUID(),
    name: "Dropdown 2",
    type: ColumnType.Dropdown,
    boardId,
    config: {
      type: ColumnType.Dropdown,
      options: DEFAULT_DROPDOWN_OPTIONS,
    },
  };

  const dropdown3Column: Column = {
    id: crypto.randomUUID(),
    name: "Dropdown 3",
    type: ColumnType.Dropdown,
    boardId,
    config: {
      type: ColumnType.Dropdown,
      options: DEFAULT_DROPDOWN_OPTIONS,
    },
  };

  // Create groups and items
  const groups: Group[] = [];
  const items: Item[] = [];
  const groupIds: string[] = [];

  groupNames.forEach((groupName, groupIdx) => {
    const groupId = crypto.randomUUID();
    groupIds.push(groupId);
    const itemIds: string[] = [];
    itemNames.forEach((itemName, itemIdx) => {
      const itemId = crypto.randomUUID();
      itemIds.push(itemId);

      // Set default values using switch cases to avoid potential undefined values
      let dropdown1Value = "option-1"; // Default to first option
      let dropdown2Value = "option-2"; // Default to second option
      let dropdown3Value = "option-3"; // Default to third option
      let statusValue = "status_todo"; // Default to todo

      // Assign different values based on item index
      switch (itemIdx) {
        case 0:
          dropdown1Value = "option-1";
          dropdown2Value = "option-2";
          dropdown3Value = "option-3";
          statusValue = "status_todo";
          break;
        case 1:
          dropdown1Value = "option-2";
          dropdown2Value = "option-3";
          dropdown3Value = "option-1";
          statusValue = "status_working";
          break;
        case 2:
          dropdown1Value = "option-3";
          dropdown2Value = "option-1";
          dropdown3Value = "option-2";
          statusValue = "status_done";
          break;
        default:
          // Use defaults set above
          break;
      }

      items.push({
        id: itemId,
        name: itemName,
        groupId,
        [nameColumn.id]: itemName, // for column-based access
        [statusColumn.id]: statusValue,
        [dropdown1Column.id]: dropdown1Value,
        [dropdown2Column.id]: dropdown2Value,
        [dropdown3Column.id]: dropdown3Value,
      });
    });
    groups.push({
      id: groupId,
      name: groupName,
      boardId,
      items: itemIds,
      color: groupIdx === 0 ? "blue" : "red",
    });
  });

  const allColumns = [
    nameColumn,
    statusColumn,
    dropdown1Column,
    dropdown2Column,
    dropdown3Column,
  ];

  const board: Board = {
    id: boardId,
    name: boardName,
    groups: groupIds,
    columns: allColumns,
    ...(folderId ? { folderId } : {}),
  };

  return {
    board,
    groups,
    items,
    columns: allColumns,
  };
}
