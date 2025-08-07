"use client";

import type { FC } from "react";
import { useEmailParserStore } from "../../store";

export const ConfirmDialog: FC = () => {
  const confirmDialog = useEmailParserStore((s) => s.confirmDialog);
  const clearConfirmDialog = useEmailParserStore((s) => s.clearConfirmDialog);

  if (!confirmDialog) return null;

  const handleConfirm = () => {
    confirmDialog.onConfirm();
    clearConfirmDialog();
  };

  const handleCancel = () => {
    if (confirmDialog.onCancel) {
      confirmDialog.onCancel();
    }
    clearConfirmDialog();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Confirm Action
        </h3>
        <p className="mb-6 text-sm text-gray-500">{confirmDialog.message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
