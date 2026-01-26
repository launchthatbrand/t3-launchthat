import { ArrowRight, Bot, MessageCircle, Send } from "lucide-react";

import { Button } from "@acme/ui/moving-border";
import { GlassTitle } from "../../../components/landing/GlassTitle";
import { Grid } from "@acme/ui/features-section";
import Link from "next/link";
import React from "react";
import { ShootingStars } from "@acme/ui/shooting-stars";

function IntegrationCard({
  title,
  description,
  icon,
  href,
  color,
  badge,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="group block h-full">
      <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition-all duration-300 hover:border-white/20 hover:bg-white/10">
        <Grid size={20} />

        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-6 flex items-start justify-between">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white shadow-lg backdrop-blur-md"
              style={{ color }}
            >
              {icon}
            </div>
            {badge && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                {badge}
              </span>
            )}
          </div>

          <h3 className="mb-3 text-2xl font-bold text-white">{title}</h3>
          <p className="mb-8 grow text-base leading-relaxed text-white/60">
            {description}
          </p>

          <div className="flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:text-white">
            Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function IntegrationsMarketingPage() {
  return (
    <div >
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShootingStars
          starColor="#5865F2"
          trailColor="#2EB9DF"
          minDelay={1000}
          maxDelay={3000}
          className="opacity-40"
        />
      </div>

      <main className="relative z-10 pt-32 pb-20">
        <section className="container mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
              <span className="block leading-none">
                <GlassTitle
                  text="Connect your"
                  className="h-[1.9em] -mb-6 w-auto max-w-full align-middle"
                />
              </span>
              <span className="block leading-none text-transparent bg-clip-text bg-linear-to-b from-white to-white/50">
                community tools
              </span>
            </h1>

            <p className="mt-8 text-xl text-white/60">
              Integrate Trader Launchpad with the platforms your community already uses.
              Automate signals, manage memberships, and sync data seamlessly.
            </p>
          </div>

          <div className="mt-24 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <IntegrationCard
              title="Discord"
              description="Power your Discord community with automated trade signals, role management, and deep integration with your trading data."
              icon={<Bot className="h-8 w-8" />}
              color="#5865F2"
              href="/discord"
              badge="Popular"
            />

            <IntegrationCard
              title="Telegram"
              description="Broadcast lightning-fast signals to your subscribers. Manage paid channels and automate content delivery directly to Telegram."
              icon={<Send className="h-8 w-8" />}
              color="#229ED9"
              href="/integrations/telegram"
              badge="New"
            />

            {/* Placeholder for future integrations or a generic "Request" card */}
            <div className="relative h-full overflow-hidden rounded-3xl border border-dashed border-white/10 bg-transparent p-8">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/40">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white/80">More coming soon</h3>
                <p className="mt-2 text-sm text-white/50">
                  We're building integrations for Slack, WhatsApp, and more.
                </p>
                <Button
                  as="div"
                  borderRadius="1rem"
                  className="mt-6 bg-white/5 text-white border-white/10 h-9 px-4 text-xs cursor-pointer hover:bg-white/10"
                >
                  Request Integration
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
