import {
  clearTokens,
  getStoredTokens,
  isTokenValid,
  saveTokens,
} from "../lib/gmail/storage";
import { getAuthUrl, getOAuthClient, setCredentials } from "../lib/gmail/auth";
import { getEmail, listEmails } from "../lib/gmail/api";
import { useCallback, useEffect, useState } from "react";

import { useEmailParserStore } from "../store";

interface EmailItem {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
}

export function useGmail() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [emailList, setEmailList] = useState<
    { id: string; threadId: string }[]
  >([]);
  const [loadedEmails, setLoadedEmails] = useState<Record<string, EmailItem>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSelectedEmailId = useEmailParserStore((s) => s.setSelectedEmailId);
  const showToast = useEmailParserStore((s) => s.showToast);
  const setLoading = useEmailParserStore((s) => s.setLoading);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const isValid = isTokenValid();
      setIsAuthenticated(isValid);
    };

    checkAuth();

    // Handle auth callback if present in URL
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (code) {
      handleAuthCallback(code);
      // Remove code from URL without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle the OAuth callback
  const handleAuthCallback = async (code: string) => {
    try {
      setIsAuthenticating(true);
      setLoading(true);

      const oAuth2Client = getOAuthClient();
      const tokens = await getOAuthClient().getToken(code);

      if (!tokens.tokens.access_token) {
        throw new Error("Failed to get access token");
      }

      saveTokens({
        access_token: tokens.tokens.access_token,
        refresh_token: tokens.tokens.refresh_token,
        expiry_date: tokens.tokens.expiry_date || 0,
      });

      setIsAuthenticated(true);
      showToast("success", "Successfully connected to Gmail");
    } catch (error) {
      console.error("Error processing auth callback:", error);
      setError("Failed to authenticate with Gmail");
      showToast("error", "Failed to authenticate with Gmail");
    } finally {
      setIsAuthenticating(false);
      setLoading(false);
    }
  };

  // Generate authentication URL
  const getLoginUrl = useCallback(() => {
    try {
      const oAuth2Client = getOAuthClient();
      return getAuthUrl(oAuth2Client);
    } catch (error) {
      console.error("Error generating auth URL:", error);
      setError("Failed to generate authentication URL");
      return "#";
    }
  }, []);

  // Fetch email list
  const fetchEmails = useCallback(async () => {
    if (!isAuthenticated) {
      setError("Not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      setLoading(true);

      const tokens = getStoredTokens();
      if (!tokens) {
        throw new Error("No tokens found");
      }

      const oAuth2Client = getOAuthClient();
      setCredentials(oAuth2Client, tokens);

      const messages = await listEmails(oAuth2Client);
      setEmailList(messages);

      showToast("success", `Loaded ${messages.length} emails`);
    } catch (error) {
      console.error("Error fetching emails:", error);
      setError("Failed to fetch emails");
      showToast("error", "Failed to fetch emails from Gmail");
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [isAuthenticated, showToast, setLoading]);

  // Fetch a single email
  const fetchEmail = useCallback(
    async (messageId: string) => {
      if (!isAuthenticated) {
        setError("Not authenticated");
        return null;
      }

      // Return cached email if available
      if (loadedEmails[messageId]) {
        setSelectedEmailId(messageId);
        return loadedEmails[messageId];
      }

      try {
        setIsLoading(true);
        setLoading(true);

        const tokens = getStoredTokens();
        if (!tokens) {
          throw new Error("No tokens found");
        }

        const oAuth2Client = getOAuthClient();
        setCredentials(oAuth2Client, tokens);

        const email = await getEmail(oAuth2Client, messageId);

        if (email) {
          setLoadedEmails((prev) => ({
            ...prev,
            [messageId]: email,
          }));
          setSelectedEmailId(messageId);
        }

        return email;
      } catch (error) {
        console.error(`Error fetching email ${messageId}:`, error);
        setError("Failed to fetch email");
        showToast("error", "Failed to fetch email details");
        return null;
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    },
    [isAuthenticated, loadedEmails, setSelectedEmailId, showToast, setLoading],
  );

  // Logout
  const logout = useCallback(() => {
    clearTokens();
    setIsAuthenticated(false);
    setEmailList([]);
    setLoadedEmails({});
    setSelectedEmailId(null);
    showToast("info", "Logged out from Gmail");
  }, [setSelectedEmailId, showToast]);

  return {
    isAuthenticated,
    isAuthenticating,
    isLoading,
    error,
    emailList,
    loadedEmails,
    getLoginUrl,
    fetchEmails,
    fetchEmail,
    logout,
  };
}
