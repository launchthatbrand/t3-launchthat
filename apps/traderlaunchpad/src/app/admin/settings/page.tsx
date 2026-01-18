"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import React from "react";
import { TradeLockerConnectionCard } from "~/components/settings/TradeLockerConnectionCard";

export default function AdminSettingsPage() {
  return (
    <div className="animate-in fade-in mx-auto space-y-8 duration-500">
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
          <TradeLockerConnectionCard />

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
