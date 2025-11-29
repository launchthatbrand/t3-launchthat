export const generateSessionId = (organizationId: string) => {
  if (typeof crypto?.randomUUID === "function") {
    return `support-${organizationId}-${crypto.randomUUID()}`;
  }
  return `support-${organizationId}-${Date.now()}`;
};

export interface StoredSupportContact {
  contactId: string;
  fullName?: string;
  email?: string;
}

export const readStoredContact = (
  storageKey: string,
): StoredSupportContact | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as StoredSupportContact) : null;
  } catch {
    return null;
  }
};
