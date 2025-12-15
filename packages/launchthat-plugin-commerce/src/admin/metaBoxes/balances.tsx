"use client";

import type { Doc } from "@convex-config/_generated/dataModel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";

import type { AdminMetaBoxContext } from "@acme/admin-runtime";
import {
  MetaBoxFieldset,
  MetaBoxTable,
  MetaBoxTableRow,
  registerMetaBoxHook,
} from "@acme/admin-runtime";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import {
  decodeCommerceSyntheticId,
  encodeCommerceSyntheticId,
} from "../../lib/customAdapters";
import { COMMERCE_BALANCE_POST_TYPE, isCommerceBalanceSlug } from "../adapters";
import { BALANCE_META_KEYS } from "../constants";

type CommerceAdminContext = AdminMetaBoxContext<Doc<"posts">, Doc<"postTypes">>;

type BalanceStatus = "draft" | "published" | "archived";

interface BalanceFormState {
  title: string;
  slug: string;
  status: BalanceStatus;
  currency: string;
  availableBalance: string;
  pendingBalance: string;
  paymentProcessor: string;
  processorAccountId: string;
  notes: string;
}

const DEFAULT_BALANCE_STATE: BalanceFormState = {
  title: "",
  slug: "",
  status: "draft",
  currency: "USD",
  availableBalance: "0",
  pendingBalance: "0",
  paymentProcessor: "Stripe",
  processorAccountId: "",
  notes: "",
};

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .trim();

const parseBalancePayload = (
  payload?: string | null,
): Partial<BalanceFormState> | null => {
  if (!payload) {
    return null;
  }
  try {
    const parsed = JSON.parse(payload) as Partial<BalanceFormState>;
    return parsed;
  } catch {
    return null;
  }
};

const toNumberString = (value?: string | number | null) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }
  if (typeof value === "string") {
    return value;
  }
  return "0";
};

const buildBalanceMeta = (state: BalanceFormState) => {
  const available = Number.parseFloat(state.availableBalance) || 0;
  const pending = Number.parseFloat(state.pendingBalance) || 0;
  const payload = {
    title: state.title,
    slug: state.slug,
    status: state.status,
    currency: state.currency,
    availableBalance: available,
    pendingBalance: pending,
    paymentProcessor: state.paymentProcessor,
    processorAccountId: state.processorAccountId,
    notes: state.notes,
  };
  return {
    [BALANCE_META_KEYS.payload]: JSON.stringify(payload),
    [BALANCE_META_KEYS.currency]: state.currency,
    [BALANCE_META_KEYS.available]: available,
    [BALANCE_META_KEYS.pending]: pending,
    [BALANCE_META_KEYS.processor]: state.paymentProcessor,
    [BALANCE_META_KEYS.processorAccount]: state.processorAccountId,
  };
};

const buildExcerpt = (state: BalanceFormState) => {
  const available = Number.parseFloat(state.availableBalance) || 0;
  const pending = Number.parseFloat(state.pendingBalance) || 0;
  return `Available: ${available.toLocaleString(undefined, {
    style: "currency",
    currency: state.currency,
  })} · Pending: ${pending.toLocaleString(undefined, {
    style: "currency",
    currency: state.currency,
  })}`;
};

const buildContent = (state: BalanceFormState) => {
  const available = Number.parseFloat(state.availableBalance) || 0;
  const pending = Number.parseFloat(state.pendingBalance) || 0;
  return [
    `Payment Processor: ${state.paymentProcessor || "N/A"}`,
    state.processorAccountId
      ? `Processor Account ID: ${state.processorAccountId}`
      : null,
    `Currency: ${state.currency}`,
    `Available Balance: ${available.toLocaleString(undefined, {
      style: "currency",
      currency: state.currency,
    })}`,
    `Pending Balance: ${pending.toLocaleString(undefined, {
      style: "currency",
      currency: state.currency,
    })}`,
    state.notes?.length ? `Notes:\n${state.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
};

const BalanceMetaBox = ({ context }: { context: CommerceAdminContext }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCommercePost = useMutation(
    api.plugins.commerce.mutations.createPost,
  );
  const updateCommercePost = useMutation(
    api.plugins.commerce.mutations.updatePost,
  );

  const commerceInfo = useMemo(() => {
    if (!context.post?._id) {
      return null;
    }
    return decodeCommerceSyntheticId(context.post._id);
  }, [context.post?._id]);

  const storedPayload = context.getMetaValue?.(BALANCE_META_KEYS.payload) as
    | string
    | undefined;

  const parsedPayload = useMemo(
    () => parseBalancePayload(storedPayload),
    [storedPayload],
  );

  const initialState = useMemo<BalanceFormState>(() => {
    const metaCurrency = context.getMetaValue?.(BALANCE_META_KEYS.currency) as
      | string
      | undefined;
    const metaAvailable = context.getMetaValue?.(
      BALANCE_META_KEYS.available,
    ) as number | string | undefined;
    const metaPending = context.getMetaValue?.(BALANCE_META_KEYS.pending) as
      | number
      | string
      | undefined;
    const metaProcessor = context.getMetaValue?.(
      BALANCE_META_KEYS.processor,
    ) as string | undefined;
    const metaProcessorAccount = context.getMetaValue?.(
      BALANCE_META_KEYS.processorAccount,
    ) as string | undefined;

    return {
      title: parsedPayload?.title ?? context.post?.title ?? "",
      slug: parsedPayload?.slug ?? context.post?.slug ?? "",
      status: (parsedPayload?.status ??
        context.post?.status ??
        "draft") as BalanceStatus,
      currency: parsedPayload?.currency ?? metaCurrency ?? "USD",
      availableBalance:
        parsedPayload?.availableBalance ?? toNumberString(metaAvailable) ?? "0",
      pendingBalance:
        parsedPayload?.pendingBalance ?? toNumberString(metaPending) ?? "0",
      paymentProcessor:
        parsedPayload?.paymentProcessor ?? metaProcessor ?? "Stripe",
      processorAccountId:
        parsedPayload?.processorAccountId ?? metaProcessorAccount ?? "",
      notes: parsedPayload?.notes ?? context.post?.content ?? "",
    };
  }, [
    context.getMetaValue,
    context.post?.content,
    context.post?.slug,
    context.post?.status,
    context.post?.title,
    parsedPayload,
  ]);

  const [formState, setFormState] = useState<BalanceFormState>(initialState);
  const latestStateRef = useRef(formState);

  useEffect(() => {
    latestStateRef.current = formState;
  }, [formState]);

  const organizationIdString = context.organizationId
    ? (context.organizationId as unknown as string)
    : undefined;

  const isNewRecord = context.isNewRecord || !commerceInfo;
  const [isSlugDirty, setIsSlugDirty] = useState(
    Boolean(initialState.slug?.length),
  );

  const handleTitleChange = (value: string) => {
    setFormState((previous) => {
      const next = { ...previous, title: value };
      if (!isSlugDirty) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSlugChange = (value: string) => {
    setIsSlugDirty(true);
    setFormState((previous) => ({
      ...previous,
      slug: value,
    }));
  };

  const submitBalance = useCallback(
    async (state: BalanceFormState) => {
      setIsSubmitting(true);
      try {
        const meta = buildBalanceMeta(state);
        const title = state.title.trim() || "Balance Snapshot";
        const slug =
          slugify(state.slug || state.title) ||
          `balance-${Date.now().toString(36)}`;
        const content = buildContent(state);
        const excerpt = buildExcerpt(state);

        if (isNewRecord) {
          const componentId = await createCommercePost({
            title,
            content,
            excerpt,
            slug,
            status: state.status,
            postTypeSlug: COMMERCE_BALANCE_POST_TYPE,
            meta,
            organizationId: organizationIdString,
          });
          const syntheticId = encodeCommerceSyntheticId(
            COMMERCE_BALANCE_POST_TYPE,
            componentId,
          );
          toast.success("Balance snapshot created.");
          router.replace(
            `/admin/edit?post_type=${COMMERCE_BALANCE_POST_TYPE}&post_id=${syntheticId}`,
          );
          return;
        }

        if (!commerceInfo) {
          toast.error("Unable to determine the balance record.");
          return;
        }

        await updateCommercePost({
          id: commerceInfo.componentId,
          title,
          content,
          excerpt,
          slug,
          status: state.status,
          meta,
        });
        toast.success("Balance snapshot updated.");
      } catch (error) {
        console.error("[CommerceBalanceMetaBox] submission failed", error);
        toast.error("Unable to save this balance snapshot.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      commerceInfo,
      createCommercePost,
      isNewRecord,
      organizationIdString,
      router,
      updateCommercePost,
    ],
  );

  const submitLatestState = useCallback(async () => {
    await submitBalance(latestStateRef.current);
  }, [submitBalance]);

  useEffect(() => {
    if (!context.registerBeforeSave) {
      return;
    }
    const unregister = context.registerBeforeSave(async () => {
      await submitLatestState();
    });
    return unregister;
  }, [context.registerBeforeSave, submitLatestState]);

  return (
    <MetaBoxFieldset
      title="Balance Snapshot"
      description="Track available and pending balances synced from your payment processor."
      actions={
        <Button onClick={submitLatestState} disabled={isSubmitting}>
          {isNewRecord ? "Create Balance" : "Update Balance"}
        </Button>
      }
    >
      <MetaBoxTable>
        <MetaBoxTableRow
          label={
            <Label htmlFor="balance-title" className="capitalize">
              Title
            </Label>
          }
        >
          <Input
            id="balance-title"
            value={formState.title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="e.g. Weekly settlement"
          />
        </MetaBoxTableRow>
        <MetaBoxTableRow
          label={
            <Label htmlFor="balance-slug" className="capitalize">
              Slug
            </Label>
          }
        >
          <Input
            id="balance-slug"
            value={formState.slug}
            onChange={(event) => handleSlugChange(event.target.value)}
            placeholder="weekly-settlement"
          />
        </MetaBoxTableRow>
        <MetaBoxTableRow label="Status">
          <Select
            value={formState.status}
            onValueChange={(value) =>
              setFormState((previous) => ({
                ...previous,
                status: value as BalanceStatus,
              }))
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </MetaBoxTableRow>
        <MetaBoxTableRow label="Currency">
          <Input
            value={formState.currency}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                currency: event.target.value.toUpperCase(),
              }))
            }
            className="max-w-40"
          />
        </MetaBoxTableRow>
        <MetaBoxTableRow label="Available Balance">
          <Input
            type="number"
            value={formState.availableBalance}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                availableBalance: event.target.value,
              }))
            }
          />
        </MetaBoxTableRow>
        <MetaBoxTableRow label="Pending Balance">
          <Input
            type="number"
            value={formState.pendingBalance}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                pendingBalance: event.target.value,
              }))
            }
          />
        </MetaBoxTableRow>
        <MetaBoxTableRow label="Payment Processor">
          <Input
            value={formState.paymentProcessor}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                paymentProcessor: event.target.value,
              }))
            }
            placeholder="Stripe"
          />
        </MetaBoxTableRow>
        <MetaBoxTableRow label="Processor Account ID">
          <Input
            value={formState.processorAccountId}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                processorAccountId: event.target.value,
              }))
            }
            placeholder="acct_12345"
          />
        </MetaBoxTableRow>
        <MetaBoxTableRow
          label="Notes"
          description="Optional notes or audit information that describes this snapshot."
        >
          <Textarea
            value={formState.notes}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                notes: event.target.value,
              }))
            }
            rows={4}
          />
        </MetaBoxTableRow>
      </MetaBoxTable>
    </MetaBoxFieldset>
  );
};

let balanceMetaBoxesRegistered = false;

export const registerBalanceMetaBoxes = () => {
  if (balanceMetaBoxesRegistered) {
    return;
  }

  registerMetaBoxHook<CommerceAdminContext>("main", (context) => {
    if (!isCommerceBalanceSlug(context.slug)) {
      return null;
    }

    context.visibility = {
      ...(context.visibility ?? {}),
      showGeneralPanel: false,
    };

    return {
      id: "commerce-balance-general",
      title: "Balance Snapshot",
      description:
        "Create or edit balance records that map to the commerce component tables.",
      location: "main",
      priority: -40,
      render: () => <BalanceMetaBox context={context} />,
    };
  });

  balanceMetaBoxesRegistered = true;
};
