import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";

import { createDefaultBoardStructure } from "../../store/boardDefaults";
import { useBoardStore } from "../../store/boardStore";

const NewBoardModal = () => {
  const addBoard = useBoardStore((s) => s.addBoard);
  const addGroup = useBoardStore((s) => s.addGroup);
  const addItem = useBoardStore((s) => s.addItem);
  const folders = useBoardStore((s) => s.folders);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Board name is required");
      return;
    }
    setError("");
    // Use the utility to create the default board structure
    const { board, groups, items } = createDefaultBoardStructure(
      name,
      folderId,
    );
    addBoard(board);
    groups.forEach(addGroup);
    items.forEach(addItem);
    setName("");
    setFolderId(undefined);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex w-full items-center gap-2">
          <Plus className="h-4 w-4" /> New Board
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            autoFocus
            placeholder="Board name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className=""
          />
          <div>
            <label className="mb-1 block text-sm font-medium">
              Folder (optional)
            </label>
            <select
              className="w-full rounded border px-2 py-1"
              value={folderId ?? ""}
              onChange={(e) => setFolderId(e.target.value || undefined)}
            >
              <option value="">No folder</option>
              {Object.values(folders).map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
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

export default NewBoardModal;
