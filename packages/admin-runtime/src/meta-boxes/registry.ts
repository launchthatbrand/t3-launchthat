import type { ReactNode } from "react";

export type MetaBoxLocation = "main" | "sidebar";

export interface RegisteredMetaBox<TContext = unknown> {
  id: string;
  title: string;
  description?: string;
  location: MetaBoxLocation;
  priority?: number;
  render: (context: TContext) => ReactNode;
}

export type MetaBoxHook<TContext = unknown> = (
  context: TContext,
) =>
  | RegisteredMetaBox<TContext>
  | RegisteredMetaBox<TContext>[]
  | null
  | undefined;

const registry: Record<MetaBoxLocation, MetaBoxHook<any>[]> = {
  main: [],
  sidebar: [],
};

export const registerMetaBoxHook = <TContext = unknown>(
  location: MetaBoxLocation,
  hook: MetaBoxHook<TContext>,
) => {
  registry[location].push(hook as MetaBoxHook<any>);
  return () => {
    registry[location] =
      registry[location]?.filter((candidate) => candidate !== hook) ?? [];
  };
};

export const collectRegisteredMetaBoxes = <TContext = unknown>(
  location: MetaBoxLocation,
  context: TContext,
): RegisteredMetaBox<TContext>[] => {
  const hooks = registry[location] ?? [];
  const registrations: RegisteredMetaBox<TContext>[] = [];

  hooks.forEach((hook) => {
    const result = hook(context);
    if (!result) {
      return;
    }

    if (Array.isArray(result)) {
      registrations.push(
        ...result.filter(
          (registration): registration is RegisteredMetaBox<TContext> =>
            Boolean(registration),
        ),
      );
    } else {
      registrations.push(result);
    }
  });

  return registrations;
};
