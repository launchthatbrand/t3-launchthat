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
    <div className="relative min-h-screen text-white selection:bg-orange-500/30">
      <main className="relative z-10 pt-28">
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
