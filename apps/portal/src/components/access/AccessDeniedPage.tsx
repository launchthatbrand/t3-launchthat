/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import React from "react";
import Link from "next/link";
import { AlertCircle, Lock } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

interface AccessDeniedAction {
  id: string;
  label: string;
  href: string;
  variant?: "default" | "outline";
  external?: boolean;
  // If true, use a plain <a href> navigation even for internal paths.
  // This is useful when root layout chrome (canvas vs standard) is computed server-side.
  reload?: boolean;
}

export function AccessDeniedPage(props: {
  reason?: string;
  contentTitle?: string;
  signInHref?: string;
  actions?: AccessDeniedAction[];
}) {
  const signInHref = props.signInHref ?? "/auth/sign-in";
  const actions = Array.isArray(props.actions) ? props.actions : [];
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center p-6">
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Access Restricted
          </CardTitle>
          {props.contentTitle ? (
            <p className="text-sm text-gray-600">
              You don&apos;t have permission to access &quot;
              {props.contentTitle}&quot;
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Access Denied</span>
          </div>
          <p className="mb-6 text-gray-600">
            {props.reason ??
              "You don't have permission to access this content."}
          </p>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href={signInHref}>Sign In</Link>
            </Button>

            {actions.map((action) => {
              const href = String(action.href ?? "").trim();
              if (!href) return null;
              const variant = action.variant ?? "outline";
              const isExternal =
                action.external === true ||
                href.startsWith("https://") ||
                href.startsWith("http://");
              const shouldReload = action.reload === true;
              return (
                <Button
                  key={action.id}
                  variant={variant}
                  asChild
                  className="w-full"
                >
                  {isExternal ? (
                    <a href={href} target="_blank" rel="noreferrer noopener">
                      {action.label}
                    </a>
                  ) : shouldReload ? (
                    <a href={href}>{action.label}</a>
                  ) : (
                    <Link href={href}>{action.label}</Link>
                  )}
                </Button>
              );
            })}

            <Button variant="outline" asChild className="w-full">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
