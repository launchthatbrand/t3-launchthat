"use client";

import { ArrowUpRight, Eye, Globe, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import Link from "next/link";
import React from "react";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";

export default function AdminPublicProfilePage() {
  const [isPublic, setIsPublic] = React.useState(true);
  const [username, setUsername] = React.useState("nova_trader");
  const [displayName, setDisplayName] = React.useState("Nova Trader");
  const [bio, setBio] = React.useState(
    "NY open breakouts, strict risk rules, and daily review. Building consistency one session at a time.",
  );

  const publicUrl = `/u/${encodeURIComponent(username)}`;

  return (
    <div className="animate-in fade-in mx-auto max-w-5xl space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-muted-foreground text-sm">Public profile</div>
          <h1 className="text-3xl font-bold tracking-tight">Profile settings</h1>
          <p className="text-muted-foreground mt-1">
            Control what’s shown publicly (stats, badges, broker) and preview your
            page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/users">
              Browse users <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button className="border-0 bg-orange-600 text-white hover:bg-orange-700" asChild>
            <Link href={publicUrl}>
              Preview public page <Eye className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-white/10 bg-white/3 backdrop-blur-md">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-orange-300" />
            Visibility
          </CardTitle>
          <CardDescription className="text-white/60">
            Turn this on to make your profile discoverable at{" "}
            <span className="font-mono text-white/80">{publicUrl}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white/85">
                Public profile
              </div>
              <div className="text-sm text-white/60">
                If off, your page returns 404 to non-admin visitors.
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
              />
              <div className="text-xs text-white/45">
                Public URL:{" "}
                <span className="font-mono text-white/70">{publicUrl}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-24"
              placeholder="Tell the fleet about your trading style..."
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <Shield className="h-4 w-4 text-orange-200/80" />
              What’s shown
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/60">
              <li>Basic stats (win rate, profit factor, streak)</li>
              <li>Badges granted by the platform</li>
              <li>Connected broker (primary)</li>
              <li>Leaderboard ranks</li>
              <li>Recent trades (if enabled later)</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="border-0 bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => {
                // Mock save
                // eslint-disable-next-line no-alert
                alert("Saved (mock).");
              }}
            >
              Save changes
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/settings">Account settings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

