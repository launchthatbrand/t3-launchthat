import { useState } from "react";
import { FolderPlus, Layout, Plus } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

import { createDefaultBoardStructure } from "../../store/boardDefaults";
import { useBoardStore } from "../../store/boardStore";

const AddNewDropdown = () => {
  const addBoard = useBoardStore((s) => s.addBoard);
  const addGroup = useBoardStore((s) => s.addGroup);
  const addItem = useBoardStore((s) => s.addItem);
  const addFolder = useBoardStore((s) => s.addFolder);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"none" | "board" | "folder">("none");
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    if (mode === "board") {
      const { board, groups, items } = createDefaultBoardStructure(name);
      addBoard(board);
      groups.forEach(addGroup);
      items.forEach(addItem);
    } else if (mode === "folder") {
      addFolder({ id: crypto.randomUUID(), name, boards: [] });
    }
    setName("");
    setMode("none");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Add New Board or Folder"
          className="text-primary"
        >
          <Plus />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        {mode === "none" && (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setMode("board")}
            >
              {" "}
              <Layout className="h-4 w-4" /> New Board{" "}
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setMode("folder")}
            >
              {" "}
              <FolderPlus className="h-4 w-4" /> New Folder{" "}
            </Button>
          </div>
        )}
        {(mode === "board" || mode === "folder") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            className="flex flex-col gap-2"
          >
            <Input
              autoFocus
              placeholder={mode === "board" ? "Board name" : "Folder name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className=""
            />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm">
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMode("none");
                  setName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default AddNewDropdown;
