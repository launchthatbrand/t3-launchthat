"use client";

import React from "react";
import {
  Bell,
  ChevronRight,
  CreditCard,
  LogOut,
  Plug,
  RefreshCw,
  Shield,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
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
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function AdminSettingsPage() {
  return (
    <div className="animate-in fade-in mx-auto max-w-5xl space-y-8 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and integrations.
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto md:w-auto">
          <TabsTrigger value="account" className="flex-1 md:flex-none">
            Account
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex-1 md:flex-none">
            Connections
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 md:flex-none">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex-1 md:flex-none">
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your photo and personal details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                  <p className="text-muted-foreground text-xs">
                    JPG, GIF or PNG. 1MB max.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    defaultValue="Desmond T."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    defaultValue="desmond@example.com"
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Trading Bio</Label>
                <Input
                  id="bio"
                  placeholder="Tell us about your trading style..."
                  defaultValue="Discretionary scalper focusing on NAS100."
                />
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t px-6 py-4">
              <div className="text-muted-foreground text-xs">
                Last saved: Today at 10:42 AM
              </div>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
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

          <Card className="border-dashed opacity-70">
            <CardHeader>
              <CardTitle>MetaTrader 5</CardTitle>
              <CardDescription>Connect via EA or Signal Start.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
                <p className="text-muted-foreground max-w-sm text-sm">
                  Coming soon. Integration with MT5 is currently in beta. Join
                  the waitlist to be notified.
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t px-6 py-4">
              <Button disabled>Connect</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
