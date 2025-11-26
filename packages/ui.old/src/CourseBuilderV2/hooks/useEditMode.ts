import { useCallback, useState } from "react";

interface UseEditModeReturn {
  /** Whether edit mode is currently active */
  isEditing: boolean;
  /** Function to toggle the edit mode state */
  toggleEditMode: () => void;
  /** Function to explicitly enter edit mode */
  enterEditMode: () => void;
  /** Function to explicitly exit edit mode */
  exitEditMode: () => void;
}

/**
 * Custom hook to manage a simple boolean edit mode state.
 *
 * @param {boolean} initialMode - The initial state of the edit mode (defaults to false).
 * @returns {UseEditModeReturn} An object containing the edit mode state and control functions.
 */
export const useEditMode = (initialMode = false): UseEditModeReturn => {
  const [isEditing, setIsEditing] = useState<boolean>(initialMode);

  const toggleEditMode = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  const enterEditMode = useCallback(() => {
    setIsEditing(true);
  }, []);

  const exitEditMode = useCallback(() => {
    setIsEditing(false);
  }, []);

  return {
    isEditing,
    toggleEditMode,
    enterEditMode,
    exitEditMode,
  };
};
