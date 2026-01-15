import React from "react";
import Link from "next/link";
import { Button } from "@acme/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "Perfect for getting started with manual journaling.",
    features: ["Manual Trade Entry", "Basic Performance Stats", "1 Trading Account", "7-Day History"],
    cta: "Start Free",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "Automate your edge with full sync & AI insights.",
    features: [
      "Real-time Auto Sync", 
      "AI Trade Insights", 
      "Unlimited Accounts", 
      "Unlimited History",
      "Advanced Analytics"
    ],
    cta: "Start Trial",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Prop Firm",
    price: "$49",
    period: "/mo",
    description: "For serious traders managing multiple funded accounts.",
    features: [
      "Everything in Pro",
      "Multi-Broker Aggregation",
      "Leaderboard Access",
      "Risk Management Alerts",
      "Priority Support"
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-black/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-400">
            Start free, upgrade when you're ready to scale.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={`relative flex flex-col p-8 rounded-2xl border ${
                plan.popular 
                  ? "bg-white/5 border-blue-500/50 shadow-2xl shadow-blue-900/20" 
                  : "bg-[#0A0A0A] border-white/10"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              <div className="flex-1 mb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-blue-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                asChild 
                variant={plan.variant === "default" ? "default" : "outline"}
                className={`w-full ${plan.variant === "default" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-white/10 text-white hover:bg-white/5"}`}
              >
                <Link href="/sign-up">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
