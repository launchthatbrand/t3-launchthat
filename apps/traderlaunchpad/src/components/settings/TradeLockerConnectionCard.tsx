"use client";

import React from "react";
import { Plug, RefreshCw } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

export function TradeLockerConnectionCard() {
  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              TradeLocker
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
              >
                Connected
              </Badge>
            </CardTitle>
            <CardDescription>
              Primary trading account connection.
            </CardDescription>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10">
            <Plug className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/30 grid gap-4 rounded-lg border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Server</span>
            <span className="font-medium">HeroFX-Demo</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Account ID</span>
            <span className="font-mono font-medium">1829530</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Synced</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">2 mins ago</span>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t px-6 py-4">
        <Button
          variant="outline"
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          Disconnect
        </Button>
        <Button variant="secondary">Update Credentials</Button>
      </CardFooter>
    </Card>
  );
}
