import type { Doc, Id } from "@/convex/_generated/dataModel";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

const boardSchema = z.object({
  name: z.string().min(1, "Board name is required"),
});

type BoardFormValues = z.infer<typeof boardSchema>;

interface BoardFormProps {
  board?: Doc<"taskBoards">;
  onSuccess?: () => void;
}

export const BoardForm: React.FC<BoardFormProps> = ({ board, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BoardFormValues>({
    resolver: zodResolver(boardSchema),
    defaultValues: { name: board?.name ?? "" },
  });

  const createBoard = useMutation<typeof api.tasks.boards.createBoard>(
    api.tasks.boards.createBoard,
  );
  const updateBoard = useMutation<typeof api.tasks.boards.updateBoard>(
    api.tasks.boards.updateBoard,
  );
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (values: BoardFormValues) => {
    setError(null);
    try {
      if (board) {
        await updateBoard({
          boardId: board._id as Id<"taskBoards">,
          name: values.name,
        });
      } else {
        await createBoard({ name: values.name });
      }
      reset();
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="board-name" className="mb-1 block text-sm font-medium">
          Board Name
        </label>
        <Input
          id="board-name"
          {...register("name")}
          disabled={isSubmitting}
          autoFocus
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : board ? "Save Changes" : "Create Board"}
        </Button>
      </div>
    </form>
  );
};

export default BoardForm;
