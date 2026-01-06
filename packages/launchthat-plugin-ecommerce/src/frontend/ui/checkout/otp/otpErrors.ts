"use client";

export const toUserSafeOtpError = (err: unknown): string => {
  const message = err instanceof Error ? err.message : "";
  const normalized = message.trim().toLowerCase();
  if (!normalized) return "Something went wrong. Please try again.";

  if (normalized.includes("expired")) {
    return "That code expired. Please request a new one.";
  }
  if (normalized.includes("too many") || normalized.includes("rate")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (normalized.includes("invalid") || normalized.includes("incorrect")) {
    return "Invalid code. Please try again.";
  }
  if (normalized.includes("sms") && normalized.includes("send")) {
    return "Could not send SMS code. Please try again.";
  }
  return message.trim();
};
