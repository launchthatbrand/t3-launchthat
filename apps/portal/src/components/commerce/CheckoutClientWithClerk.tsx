"use client";

import React, { useMemo } from "react";
import { useClerk, useSignUp } from "@clerk/nextjs";

import { CheckoutClient } from "launchthat-plugin-ecommerce";

type Props = Omit<React.ComponentProps<typeof CheckoutClient>, "clerk">;

export function CheckoutClientWithClerk(props: Props) {
  const { openSignIn } = useClerk();
  const { isLoaded, signUp, setActive } = useSignUp();

  const clerkAdapter = useMemo(() => {
    return {
      isLoaded,
      openSignIn: () => {
        if (typeof openSignIn === "function") {
          void openSignIn({});
        }
      },
      signUpWithPassword: async (args: {
        emailAddress: string;
        password: string;
      }): Promise<{ createdSessionId: string | null }> => {
        if (!isLoaded || !signUp) {
          throw new Error("Authentication is still loading. Please try again.");
        }

        const result = await signUp.create({
          emailAddress: args.emailAddress,
          password: args.password,
        });

        const createdSessionId =
          (result as any)?.createdSessionId ??
          (signUp as any)?.createdSessionId ??
          null;

        if (typeof createdSessionId === "string" && createdSessionId.trim()) {
          await setActive?.({ session: createdSessionId });
        }

        return {
          createdSessionId:
            typeof createdSessionId === "string" ? createdSessionId : null,
        };
      },
    };
  }, [isLoaded, openSignIn, setActive, signUp]);

  return <CheckoutClient {...props} clerk={clerkAdapter} />;
}


