"use client";

import { useEffect, useMemo, useState } from "react";

import { toUserSafeOtpError } from "./otpErrors";

type ClerkOtpClient = {
  startPhoneOtpSignIn?: (args: {
    phoneNumber: string;
    emailAddress?: string;
  }) => Promise<void>;
  attemptPhoneOtpSignIn?: (args: {
    code: string;
    emailAddress?: string;
  }) => Promise<void>;
};

export const usePhoneOtp = (args: {
  clerk: ClerkOtpClient | undefined;
  buyerPhone: string;
  buyerEmail?: string;
  isSendingAccess: boolean;
  isVerifyingAccess: boolean;
  accessOtpCode: string;
  otpResendCooldownMs: number;
  otpResendAvailableAtMs: number;
  setOtpResendAvailableAtMs: (ms: number) => void;
  setAccessStatus: (s: string | null) => void;
  setAccessError: (s: string | null) => void;
  setIsSendingAccess: (v: boolean) => void;
  setIsVerifyingAccess: (v: boolean) => void;
  setAccessPanel: (
    p: "choose" | "email" | "phone_send" | "phone_verify",
  ) => void;
  attemptClaimAfterAuth: () => Promise<void>;
  postVerifyRedirect: () => void;
}) => {
  const {
    clerk,
    buyerPhone,
    buyerEmail,
    isSendingAccess,
    isVerifyingAccess,
    accessOtpCode,
    otpResendCooldownMs,
    otpResendAvailableAtMs,
    setOtpResendAvailableAtMs,
    setAccessStatus,
    setAccessError,
    setIsSendingAccess,
    setIsVerifyingAccess,
    setAccessPanel,
    attemptClaimAfterAuth,
    postVerifyRedirect,
  } = args;

  const [otpNowMs, setOtpNowMs] = useState(() => Date.now());
  const [lastAutoVerifyCode, setLastAutoVerifyCode] = useState("");

  const otpResendSecondsLeft = useMemo(() => {
    return Math.max(0, Math.ceil((otpResendAvailableAtMs - otpNowMs) / 1_000));
  }, [otpNowMs, otpResendAvailableAtMs]);

  useEffect(() => {
    if (otpResendAvailableAtMs <= Date.now()) return;
    setOtpNowMs(Date.now());
    const id = window.setInterval(() => setOtpNowMs(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, [otpResendAvailableAtMs]);

  const handleSendPhoneCode = async (): Promise<void> => {
    if (!buyerPhone || !clerk?.startPhoneOtpSignIn) return;
    if (isSendingAccess || isVerifyingAccess) return;

    setAccessError(null);
    setAccessStatus(null);
    setIsSendingAccess(true);
    try {
      await clerk.startPhoneOtpSignIn({
        phoneNumber: buyerPhone,
        emailAddress: buyerEmail || undefined,
      });
      setAccessStatus("Enter the code we texted you.");
      setAccessPanel("phone_verify");
      setOtpResendAvailableAtMs(Date.now() + otpResendCooldownMs);
    } catch (err: unknown) {
      setAccessError(toUserSafeOtpError(err));
    } finally {
      setIsSendingAccess(false);
    }
  };

  const handleVerifyPhoneCode = async (
    codeOverride?: string,
  ): Promise<void> => {
    if (!clerk?.attemptPhoneOtpSignIn) return;
    if (isSendingAccess || isVerifyingAccess) return;

    const code = (codeOverride ?? accessOtpCode).trim();
    if (code.length < 6) return;

    setAccessError(null);
    setAccessStatus(null);
    setIsVerifyingAccess(true);
    try {
      await clerk.attemptPhoneOtpSignIn({
        code,
        emailAddress: buyerEmail || undefined,
      });
      setAccessStatus("Signed in. Redirecting…");
      await attemptClaimAfterAuth();
      postVerifyRedirect();
    } catch (err: unknown) {
      setAccessError(toUserSafeOtpError(err));
    } finally {
      setIsVerifyingAccess(false);
    }
  };

  const bindOtpInputOnChange = (setAccessOtpCode: (v: string) => void) => {
    return (next: string) => {
      setAccessOtpCode(next);
      const trimmed = next.trim();
      if (trimmed.length !== 6) return;
      if (trimmed === lastAutoVerifyCode) return;
      setLastAutoVerifyCode(trimmed);
      void handleVerifyPhoneCode(trimmed);
    };
  };

  return {
    otpResendSecondsLeft,
    handleSendPhoneCode,
    handleVerifyPhoneCode,
    bindOtpInputOnChange,
  };
};
