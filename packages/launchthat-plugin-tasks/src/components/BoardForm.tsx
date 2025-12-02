"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

import { getBoardMutations } from "../api/tasks";
import { useTasksApi, useTasksMutation } from "../context/TasksClientProvider";

const boardSchema = z.object({
  name: z.string().min(1, "Board name is required"),
});

type BoardFormValues = z.infer<typeof boardSchema>;

interface BoardFormProps {
  board?: Doc<"taskBoards">;
  onSuccess?: () => void;
}

export const BoardForm: React.FC<BoardFormProps> = ({ board, onSuccess }) => {
  const tasksApi = useTasksApi<any>();
  const boardMutations = getBoardMutations(tasksApi);

  if (!boardMutations?.createBoard || !boardMutations?.updateBoard) {
    throw new Error("Tasks API is missing board mutation references.");
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BoardFormValues>({
    resolver: zodResolver(boardSchema),
    defaultValues: { name: board?.name ?? "" },
  });

  const createBoard = useTasksMutation(boardMutations.createBoard);
  const updateBoard = useTasksMutation(boardMutations.updateBoard);
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
          <p className="text-destructive mt-1 text-sm">{errors.name.message}</p>
        )}
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : board ? "Save Changes" : "Create Board"}
        </Button>
      </div>
    </form>
  );
};

export default BoardForm;
