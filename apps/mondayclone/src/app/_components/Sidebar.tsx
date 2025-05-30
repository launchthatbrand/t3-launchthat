"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";

import { useBoardStore } from "../../store/boardStore";
import AddNewDropdown from "./AddNewDropdown";
import NewBoardModal from "./NewBoardModal";
import TreeView from "./TreeView";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const setActiveFolder = useBoardStore((s) => s.setActiveFolder);
  const setActiveBoard = useBoardStore((s) => s.setActiveBoard);

  const handleSelect = (type: "folder" | "board", id: string) => {
    if (type === "folder") {
      setActiveFolder(id);
      setActiveBoard(undefined);
    } else {
      setActiveBoard(id);
      setActiveFolder(undefined);
    }
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-muted transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between border-b border-border p-2">
        <AddNewDropdown />
        <Button
          variant="ghost"
          size="icon"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>
      <div className="p-2">
        <NewBoardModal />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <TreeView onSelect={handleSelect} />
      </div>
    </aside>
  );
};

export default Sidebar;
