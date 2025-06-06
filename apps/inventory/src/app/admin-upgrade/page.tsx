"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

export default function AdminUpgradePage() {
  const router = useRouter();
  const [upgradeStatus, setUpgradeStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const makeAdmin = useMutation(api.users.makeCurrentUserAdmin);

  const handleUpgrade = async () => {
    setUpgradeStatus("loading");
    try {
      const result = await makeAdmin();
      setUpgradeStatus("success");
      setTimeout(() => {
        router.push("/admin/users");
      }, 2000);
    } catch (error) {
      console.error("Error upgrading to admin:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
      setUpgradeStatus("error");
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            {upgradeStatus === "idle" && (
              <Shield className="h-16 w-16 text-muted-foreground" />
            )}
            {upgradeStatus === "loading" && (
              <Shield className="h-16 w-16 animate-pulse text-blue-500" />
            )}
            {upgradeStatus === "success" && (
              <ShieldCheck className="h-16 w-16 text-green-500" />
            )}
            {upgradeStatus === "error" && (
              <ShieldAlert className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-center text-2xl">
            Admin Access Upgrade
          </CardTitle>
          <CardDescription className="text-center">
            Make your account an administrator for development purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              This will upgrade your current user account to have administrator
              privileges. This is intended for development use only.
            </p>
            {upgradeStatus === "success" && (
              <div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-700">
                Your account has been upgraded to admin! Redirecting to admin
                panel...
              </div>
            )}
            {upgradeStatus === "error" && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                {errorMessage ||
                  "An error occurred during the upgrade process."}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="default"
            onClick={handleUpgrade}
            disabled={
              upgradeStatus === "loading" || upgradeStatus === "success"
            }
            className="w-full"
          >
            {upgradeStatus === "loading" ? "Processing..." : "Upgrade to Admin"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
