"use client";

import { ArrowUpRight, MessageSquare, Sparkles } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import Link from "next/link";
import React from "react";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";

export default function AdminSharingClientPage() {
    const [postClosed, setPostClosed] = React.useState(true);
    const [postOpen, setPostOpen] = React.useState(false);
    const [postDaily, setPostDaily] = React.useState(false);

    const [channelMentors, setChannelMentors] = React.useState("#mentors");
    const [channelMembers, setChannelMembers] = React.useState("#members");

    return (
        <div className="animate-in fade-in space-y-8 duration-500">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <div className="text-muted-foreground text-sm">Sharing</div>
                    <h1 className="text-3xl font-bold tracking-tight">Discord posts</h1>
                    <p className="text-muted-foreground mt-1">
                        Control what gets shared and preview the exact message (mock).
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">mock</Badge>
                    <Button variant="outline" asChild>
                        <Link href="/admin/integrations/portal/setup">Portal setup</Link>
                    </Button>
                    <Button className="border-0 bg-blue-600 text-white hover:bg-blue-700" asChild>
                        <Link href="/admin/sharing/preview">
                            Preview <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 overflow-hidden">
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            What to post
                        </CardTitle>
                        <CardDescription>
                            Keep it useful and low-noise—optimize for review + learning.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                            <div className="space-y-1">
                                <div className="text-sm font-semibold">Closed TradeIdeas</div>
                                <div className="text-muted-foreground text-sm">
                                    The best signal: post only when the TradeIdea is closed.
                                </div>
                            </div>
                            <Switch checked={postClosed} onCheckedChange={setPostClosed} />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                            <div className="space-y-1">
                                <div className="text-sm font-semibold">Open TradeIdeas</div>
                                <div className="text-muted-foreground text-sm">
                                    Optional. Can create noise for active traders.
                                </div>
                            </div>
                            <Switch checked={postOpen} onCheckedChange={setPostOpen} />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                            <div className="space-y-1">
                                <div className="text-sm font-semibold">Daily summary</div>
                                <div className="text-muted-foreground text-sm">
                                    Post a daily recap with win rate, P&amp;L, and review queue count.
                                </div>
                            </div>
                            <Switch checked={postDaily} onCheckedChange={setPostDaily} />
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Mentors channel</Label>
                                <Input
                                    value={channelMentors}
                                    onChange={(e) => setChannelMentors(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Members channel</Label>
                                <Input
                                    value={channelMembers}
                                    onChange={(e) => setChannelMembers(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="text-muted-foreground text-xs">
                            Backend later: per-org channel mapping, per-symbol rules, template
                            variables, retries.
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            Premium feel
                        </CardTitle>
                        <CardDescription>Make posts feel like a product, not a bot.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-6 text-sm">
                        <div className="rounded-lg border bg-muted/20 p-4">
                            <div className="font-semibold">Recommended format</div>
                            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
                                <li>Symbol + direction + result</li>
                                <li>1 key insight (why it mattered)</li>
                                <li>Link to the TradeIdea review page</li>
                            </ul>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/admin/integrations/portal/test">
                                Send test event <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

