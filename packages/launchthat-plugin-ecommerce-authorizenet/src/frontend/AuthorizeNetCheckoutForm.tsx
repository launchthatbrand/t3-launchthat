"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@acme/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asBoolean = (value: unknown): boolean => value === true;

export function AuthorizeNetCheckoutForm({
  configValue,
  onPaymentDataChange,
}: {
  configValue: unknown;
  onPaymentDataChange?: (paymentData: unknown | null) => void;
}) {
  const cfg = useMemo(() => asRecord(configValue), [configValue]);
  const sandbox = asBoolean(cfg.sandbox);
  const apiLoginId =
    typeof cfg.apiLoginId === "string" ? cfg.apiLoginId.trim() : "";
  const clientKey =
    typeof cfg.clientKey === "string" ? cfg.clientKey.trim() : "";

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [tokenizeError, setTokenizeError] = useState<string | null>(null);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [opaqueData, setOpaqueData] = useState<{
    dataDescriptor: string;
    dataValue: string;
  } | null>(null);

  const lastSentOpaqueData = useRef<string>("");

  useEffect(() => {
    // Clear token when switching configs / editing fields.
    setOpaqueData(null);
    setTokenizeError(null);
    onPaymentDataChange?.(null);
    lastSentOpaqueData.current = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiLoginId, clientKey, sandbox]);

  useEffect(() => {
    // Load Accept.js once.
    if (typeof window === "undefined") return;
    const id = "authorize-net-acceptjs";
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.async = true;
    script.src = sandbox
      ? "https://jstest.authorize.net/v1/Accept.js"
      : "https://js.authorize.net/v1/Accept.js";
    document.head.appendChild(script);
  }, [sandbox]);

  const parseExpiry = (raw: string): { month: string; year: string } | null => {
    const digits = raw.replace(/[^\d]/g, "");
    const mm = digits.slice(0, 2);
    const yy = digits.slice(2, 4);
    if (mm.length !== 2 || yy.length !== 2) return null;
    const monthNum = Number(mm);
    if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12)
      return null;
    // Accept.js expects 4-digit year.
    const year = `20${yy}`;
    return { month: mm, year };
  };

  // Debounced tokenization when card fields look complete.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!apiLoginId || !clientKey) return;
    if (!cardNumber.trim() || !expiry.trim() || !cvc.trim()) return;

    const exp = parseExpiry(expiry);
    if (!exp) return;

    const w = window as unknown as {
      Accept?: {
        dispatchData: (
          payload: unknown,
          cb: (response: unknown) => void,
        ) => void;
      };
    };
    if (!w.Accept || typeof w.Accept.dispatchData !== "function") return;

    const timeout = window.setTimeout(() => {
      setIsTokenizing(true);
      setTokenizeError(null);

      const payload = {
        authData: { clientKey, apiLoginId },
        cardData: {
          cardNumber: cardNumber.replace(/[^\d]/g, ""),
          month: exp.month,
          year: exp.year,
          cardCode: cvc.replace(/[^\d]/g, ""),
        },
      };

      w.Accept?.dispatchData(payload, (response) => {
        setIsTokenizing(false);

        const r =
          response && typeof response === "object" && !Array.isArray(response)
            ? (response as Record<string, unknown>)
            : {};

        const messages = asRecord(r.messages);
        const resultCode =
          typeof messages.resultCode === "string"
            ? messages.resultCode.toLowerCase()
            : "";

        if (resultCode !== "ok") {
          const msgArr = messages.message;
          const first =
            Array.isArray(msgArr) && msgArr[0] && typeof msgArr[0] === "object"
              ? (msgArr[0] as Record<string, unknown>)
              : {};
          const text =
            typeof first.text === "string"
              ? first.text
              : "Card tokenization failed";
          setOpaqueData(null);
          onPaymentDataChange?.(null);
          setTokenizeError(text);
          return;
        }

        const od = asRecord(r.opaqueData);
        const dataDescriptor =
          typeof od.dataDescriptor === "string" ? od.dataDescriptor : "";
        const dataValue = typeof od.dataValue === "string" ? od.dataValue : "";
        if (!dataDescriptor || !dataValue) {
          setOpaqueData(null);
          onPaymentDataChange?.(null);
          setTokenizeError("Card tokenization returned no opaqueData");
          return;
        }

        const newOpaqueData = { dataDescriptor, dataValue };
        setOpaqueData(newOpaqueData);

        const fingerprint = `${dataDescriptor}:${dataValue}`;
        if (lastSentOpaqueData.current !== fingerprint) {
          lastSentOpaqueData.current = fingerprint;
          onPaymentDataChange?.({ opaqueData: newOpaqueData });
        }
      });
    }, 600);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiLoginId, clientKey, cardNumber, cvc, expiry]);

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Card details</CardTitle>
          {sandbox ? <Badge variant="secondary">Sandbox</Badge> : null}
        </div>
        <CardDescription>
          Enter your card details to complete the purchase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!apiLoginId || !clientKey ? (
          <div className="text-muted-foreground text-xs">
            This payment method is missing required settings (API Login ID +
            Client Key). Add them in Ecommerce → Settings → Payment processors →
            Authorize.Net.
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="authnet-card-name">Name on card</Label>
          <Input
            id="authnet-card-name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Jane Doe"
            autoComplete="cc-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="authnet-card-number">Card number</Label>
          <Input
            id="authnet-card-number"
            inputMode="numeric"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.currentTarget.value)}
            placeholder="1234 1234 1234 1234"
            autoComplete="cc-number"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="authnet-expiry">Expiration</Label>
            <Input
              id="authnet-expiry"
              inputMode="numeric"
              value={expiry}
              onChange={(e) => setExpiry(e.currentTarget.value)}
              placeholder="MM / YY"
              autoComplete="cc-exp"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authnet-cvc">Security code</Label>
            <Input
              id="authnet-cvc"
              inputMode="numeric"
              value={cvc}
              onChange={(e) => setCvc(e.currentTarget.value)}
              placeholder="CVC"
              autoComplete="cc-csc"
            />
          </div>
        </div>

        {tokenizeError ? (
          <div className="text-destructive text-xs">{tokenizeError}</div>
        ) : opaqueData ? (
          <div className="text-muted-foreground text-xs">
            Card tokenized. Ready to submit.
          </div>
        ) : isTokenizing ? (
          <div className="text-muted-foreground text-xs">Tokenizing…</div>
        ) : (
          <div className="text-muted-foreground text-xs">
            Card details will be tokenized securely before submission.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
