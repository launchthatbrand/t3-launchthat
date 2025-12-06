import type { ReactNode } from "react";

import type { AdminMetaBoxContext } from "../types";

export type MetaBoxLocation = "main" | "sidebar";

export interface RegisteredMetaBox {
  id: string;
  title: string;
  description?: string;
  location: MetaBoxLocation;
  priority?: number;
  render: (context: AdminMetaBoxContext) => ReactNode;
}

export type MetaBoxHook = (
  context: AdminMetaBoxContext,
) => RegisteredMetaBox | RegisteredMetaBox[] | null | undefined;

const registry: Record<MetaBoxLocation, MetaBoxHook[]> = {
  main: [],
  sidebar: [],
};

export const registerMetaBoxHook = (
  location: MetaBoxLocation,
  hook: MetaBoxHook,
) => {
  registry[location].push(hook);
  return () => {
    registry[location] =
      registry[location]?.filter((candidate) => candidate !== hook) ?? [];
  };
};

export const collectRegisteredMetaBoxes = (
  location: MetaBoxLocation,
  context: AdminMetaBoxContext,
): RegisteredMetaBox[] => {
  const hooks = registry[location] ?? [];
  const registrations: RegisteredMetaBox[] = [];
  hooks.forEach((hook) => {
    const result = hook(context);
    if (!result) {
      return;
    }
    if (Array.isArray(result)) {
      registrations.push(
        ...result.filter((registration): registration is RegisteredMetaBox =>
          Boolean(registration),
        ),
      );
    } else {
      registrations.push(result);
    }
  });
  return registrations;
};
