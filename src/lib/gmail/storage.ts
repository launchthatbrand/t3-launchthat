/**
 * Types for token storage
 */
export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: "gmail_access_token",
  REFRESH_TOKEN: "gmail_refresh_token",
  EXPIRY_DATE: "gmail_expiry_date",
};

/**
 * Saves OAuth tokens to localStorage (client-side only)
 */
export function saveTokens(tokens: TokenData): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);

  if (tokens.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
  }

  localStorage.setItem(STORAGE_KEYS.EXPIRY_DATE, tokens.expiry_date.toString());
}

/**
 * Retrieves OAuth tokens from localStorage (client-side only)
 */
export function getStoredTokens(): TokenData | null {
  if (typeof window === "undefined") return null;

  const access_token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (!access_token) return null;

  const refresh_token =
    localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || undefined;
  const expiry_date = parseInt(
    localStorage.getItem(STORAGE_KEYS.EXPIRY_DATE) || "0",
    10,
  );

  return {
    access_token,
    refresh_token,
    expiry_date,
  };
}

/**
 * Checks if stored token is valid and not expired
 */
export function isTokenValid(): boolean {
  const tokens = getStoredTokens();

  if (!tokens) return false;

  // Check if token is expired (with 5-minute buffer)
  const currentTime = Date.now();
  const isExpired = tokens.expiry_date - 5 * 60 * 1000 < currentTime;

  return !isExpired;
}

/**
 * Clears stored tokens
 */
export function clearTokens(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.EXPIRY_DATE);
}
