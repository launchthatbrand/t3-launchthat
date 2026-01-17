import { DottedGlowBackground } from "@acme/ui";
import { GridLines } from "../background/GridLines";
import { Header } from "../landing/Header";
import React from "react";

export const AffiliatePageShell = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white selection:bg-orange-500/30">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <DottedGlowBackground
          color="rgba(255, 100, 0, 0.15)"
          glowColor="rgba(255, 120, 0, 0.55)"
          gap={24}
          radius={1.5}
          speedMin={0.2}
          speedMax={0.8}
        />
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/18 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-orange-500/10 blur-[120px]" />
      </div>

      <Header />

      <main className="relative z-10 pt-28">
        <GridLines />
        <section className="container mx-auto max-w-7xl px-4">
          <div className="mb-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-200 backdrop-blur-sm">
              Affiliate directory
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 max-w-2xl text-sm text-white/60 md:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>

          {children}
        </section>
      </main>
    </div>
  );
};

