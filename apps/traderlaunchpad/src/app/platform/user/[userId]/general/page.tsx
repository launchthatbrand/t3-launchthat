"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";

import { api } from "@convex-config/_generated/api";

export default function PlatformUserGeneralPage() {
  const params = useParams<{ userId?: string | string[] }>();
  const raw = params.userId;
  const userId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const user = useQuery(
    api.coreTenant.platformUsers.getUserByClerkId,
    userId ? { clerkId: userId } : "skip",
  );

  const createdLabel = React.useMemo(() => {
    if (!user?.createdAt) return "—";
    try {
      return new Date(user.createdAt).toLocaleString();
    } catch {
      return String(user.createdAt);
    }
  }, [user?.createdAt]);

  const [isDisabled, setIsDisabled] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    if (user) setIsAdmin(Boolean(user.isAdmin));
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4 text-blue-500" />
              Profile (mock)
            </CardTitle>
            <CardDescription>
              View core identity info and platform-level flags.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input value={userId} readOnly className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? "—"} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={user?.name ?? "—"} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Created</Label>
                <Input value={createdLabel} readOnly />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Entitlement</div>
                <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <CreditCard className="h-4 w-4 text-emerald-500" />
                  Pro (mock)
                </div>
              </div>
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Status</div>
                <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  {isDisabled ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Disabled
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Active
                    </>
                  )}
                </div>
              </div>
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Role</div>
                <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <ShieldCheck className="h-4 w-4 text-purple-500" />
                  {user?.isAdmin ? "Platform admin" : "User"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Admin controls (mock)</CardTitle>
            <CardDescription>
              These will later map to secure, audited mutations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="bg-card flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Disable account</div>
                <div className="text-muted-foreground text-sm">
                  Block sign-in and API access.
                </div>
              </div>
              <Switch checked={isDisabled} onCheckedChange={setIsDisabled} />
            </div>

            <div className="bg-card flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Platform admin</div>
                <div className="text-muted-foreground text-sm">
                  Grant access to /platform pages.
                </div>
              </div>
              <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <Button className="border-0 bg-blue-600 text-white hover:bg-blue-700">
                Save changes (mock)
              </Button>
              <Button
                variant="outline"
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                Force sign-out (mock)
              </Button>
            </div>

            <div className="text-muted-foreground pt-2 text-xs">
              Backend later: audit logs, reason required, reversible actions,
              and role enforcement.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Notes</CardTitle>
          <CardDescription>Internal-only annotations (mock).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          <div className="text-muted-foreground text-sm">
            Example: “User requested billing refund; watch for chargebacks.”
          </div>
          <Input placeholder="Add internal note…" />
          <div className="flex justify-end">
            <Button variant="outline">Add note (mock)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
