import React from "react";
import Link from "next/link";
import { Button } from "@acme/ui/button";
import { ChevronRight, ArrowUpRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-blue-400 mb-8 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          v1.0 Now Live
          <ChevronRight className="w-4 h-4" />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-tight">
          Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Trading Psychology</span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Connect your broker in seconds. Get AI-powered insights on every trade. 
          Stop guessing, start scaling your edge with automated journaling.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Button asChild size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-gray-200 border-0">
            <Link href="/sign-in">
              Start Free Trial <ArrowUpRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base border-white/10 text-white hover:bg-white/5">
            <Link href="#how-it-works">
              How it Works
            </Link>
          </Button>
        </div>

        {/* Dashboard Mockup */}
        <div className="relative mx-auto max-w-5xl">
          <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-2 shadow-2xl shadow-blue-900/20">
            <div className="rounded-lg overflow-hidden bg-[#0A0A0A] border border-white/5 aspect-[16/9] relative group">
              {/* Abstract UI representation */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
              
              <div className="absolute top-0 left-0 right-0 h-12 border-b border-white/5 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                <div className="w-3 h-3 rounded-full bg-green-500/20" />
              </div>

              <div className="absolute top-20 left-8 right-8 bottom-8 grid grid-cols-12 gap-6">
                {/* Sidebar */}
                <div className="col-span-2 hidden md:block rounded bg-white/5 border border-white/5" />
                
                {/* Main Content */}
                <div className="col-span-12 md:col-span-10 grid grid-rows-2 gap-6">
                  {/* Top Stats */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="rounded bg-white/5 border border-white/5" />
                    <div className="rounded bg-white/5 border border-white/5" />
                    <div className="rounded bg-white/5 border border-white/5" />
                  </div>
                  {/* Chart Area */}
                  <div className="rounded bg-white/5 border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 font-mono text-sm">
                      [ Live Market Data Visualization ]
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
