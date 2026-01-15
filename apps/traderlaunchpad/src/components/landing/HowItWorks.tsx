import React from "react";
import { Link2, RefreshCw, BrainCircuit } from "lucide-react";

const steps = [
  {
    icon: Link2,
    title: "Connect",
    description: "Securely link TradeLocker, MetaTrader, or cTrader accounts in seconds.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: RefreshCw,
    title: "Sync",
    description: "Trades import automatically in real-time. Say goodbye to manual spreadsheets.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: BrainCircuit,
    title: "Analyze",
    description: "AI identifies your winning patterns and emotional leaks to scale your edge.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-black/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            The Engine Behind Your Edge
          </h2>
          <p className="text-gray-400">
            Automate the boring stuff. Focus on execution.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              <div className="absolute inset-0 bg-white/5 rounded-2xl transform transition-transform group-hover:scale-[1.02] duration-300" />
              <div className="relative p-8 rounded-2xl border border-white/10 bg-[#0A0A0A] h-full">
                <div className={`w-12 h-12 rounded-lg ${step.bg} ${step.color} flex items-center justify-center mb-6`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
