import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Finally a journal that doesn't feel like homework. It just works.",
    author: "Alex M.",
    role: "Forex Scalper",
  },
  {
    quote: "The auto-sync saved me 5 hours a week. I can focus on charts now.",
    author: "Sarah K.",
    role: "Swing Trader",
  },
  {
    quote: "Found my edge in 2 days. The AI insights spotted a pattern I missed for years.",
    author: "Marcus R.",
    role: "Prop Firm Trader",
  },
];

export function SocialProof() {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Serious Traders
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex gap-1 text-yellow-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-lg text-gray-200 mb-6 leading-relaxed">
                "{t.quote}"
              </p>
              <div>
                <div className="font-semibold text-white">{t.author}</div>
                <div className="text-sm text-gray-500">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
