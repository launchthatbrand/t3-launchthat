import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { api } from "../../../convex/_generated/api";

type ThreadFormValues = {
  threadId: string;
  senderEmail: string;
};

export function GmailThreadViewer() {
  const { user } = useUser();
  const userId = user?.id;

  const [status, setStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  const findAndStoreEmail = useMutation(api.gmail.findAndStoreEmailFromSender);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ThreadFormValues>({
    defaultValues: {
      threadId: "",
      senderEmail: "",
    },
  });

  const onSubmit = async (data: ThreadFormValues) => {
    if (!userId) {
      setStatus({
        loading: false,
        success: false,
        message: "You must be signed in to use this feature",
      });
      return;
    }

    setStatus({ loading: true });
    try {
      // Call the mutation to find and store the email
      const result = await findAndStoreEmail({
        userId,
        threadId: data.threadId,
        senderFilter: data.senderEmail,
      });

      setStatus({
        loading: false,
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b px-6 py-4 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Find Email in Thread
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Extract and store emails from a specific sender in a Gmail thread
        </p>
      </div>

      <div className="px-6 py-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="threadId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Thread ID
            </label>
            <input
              id="threadId"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              placeholder="Enter Gmail thread ID"
              {...register("threadId", { required: "Thread ID is required" })}
            />
            {errors.threadId && (
              <p className="text-sm text-red-500">{errors.threadId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="senderEmail"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Sender Email
            </label>
            <input
              id="senderEmail"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              placeholder="e.g. name@example.com"
              {...register("senderEmail", {
                required: "Sender email is required",
              })}
            />
            {errors.senderEmail && (
              <p className="text-sm text-red-500">
                {errors.senderEmail.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={status.loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {status.loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              "Find and Store Email"
            )}
          </button>
        </form>
      </div>

      {status.message && (
        <div className="border-t px-6 py-4 dark:border-gray-700">
          <div
            className={`rounded-md p-4 ${status.success ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"}`}
          >
            <p className="font-medium">
              {status.success ? "Success" : "Error"}
            </p>
            <p className="mt-1 text-sm">{status.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
