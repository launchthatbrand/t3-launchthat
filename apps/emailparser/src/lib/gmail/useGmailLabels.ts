import { useEffect, useState } from "react";
import { useAction } from "convex/react";

import { api } from "../../../convex/_generated/api";

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
  selected: boolean;
}

export function useGmailLabels() {
  const fetchLabelsAction = useAction(api.gmail.fetchGmailLabels);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);

    const fetchLabels = async () => {
      try {
        const result = await fetchLabelsAction();
        setLabels(result as GmailLabel[]);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching Gmail labels:", err);
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      }
    };

    void fetchLabels();
  }, [fetchLabelsAction]);

  const refreshLabels = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchLabelsAction();
      setLabels(result as GmailLabel[]);
    } catch (err) {
      console.error("Error refreshing Gmail labels:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    labels,
    isLoading,
    error,
    refreshLabels,
    setLabels,
  };
}
