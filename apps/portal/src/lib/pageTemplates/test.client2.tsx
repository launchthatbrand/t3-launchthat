"use client";

import * as React from "react";

import type { PageTemplateContext } from "./registry";

type SectionDef = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  bg: string;
  card: string;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const TestHeroTemplate2 = ({
  post: _post,
  meta: _meta,
}: PageTemplateContext) => {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const sectionRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  const sections = React.useMemo<SectionDef[]>(
    () => [
      {
        key: "s1",
        eyebrow: "Launch",
        title: "Section One",
        description: "Snap-scrolling + sticky stacking cards.",
        bg: "bg-neutral-950",
        card: "from-violet-500/20 via-fuchsia-500/10 to-neutral-900",
      },
      {
        key: "s2",
        eyebrow: "Build",
        title: "Section Two",
        description:
          "A subtle parallax shift as you scroll through each scene.",
        bg: "bg-neutral-950",
        card: "from-amber-500/20 via-orange-500/10 to-neutral-900",
      },
      {
        key: "s3",
        eyebrow: "Ship",
        title: "Section Three",
        description: "Cards stack smoothly because each scene pins itself.",
        bg: "bg-neutral-950",
        card: "from-sky-500/20 via-cyan-500/10 to-neutral-900",
      },
      {
        key: "s4",
        eyebrow: "Scale",
        title: "Section Four",
        description: "CSS scroll-snap keeps the experience intentional.",
        bg: "bg-neutral-950",
        card: "from-emerald-500/20 via-lime-500/10 to-neutral-900",
      },
      {
        key: "s5",
        eyebrow: "Repeat",
        title: "Section Five",
        description: "End card — tweak styling/content as needed.",
        bg: "bg-neutral-950",
        card: "from-rose-500/20 via-red-500/10 to-neutral-900",
      },
    ],
    [],
  );

  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const scrollerRect = scroller.getBoundingClientRect();
      const scrollerTop = scrollerRect.top;
      const scrollerHeight = Math.max(1, scrollerRect.height);

      for (const el of sectionRefs.current) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();

        // sectionTopRel: 0 when section top hits scroller top.
        const sectionTopRel = rect.top - scrollerTop;
        const sectionHeight = Math.max(1, rect.height);

        // Progress through the scene as its top moves past the sticky line (top of scroller).
        const p = clamp01(
          -sectionTopRel / Math.min(sectionHeight, scrollerHeight * 1.25),
        );
        el.style.setProperty("--scene-p", String(p));
      }
    };

    const handleScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    const ro = new ResizeObserver(() => handleScroll());
    ro.observe(scroller);
    for (const el of sectionRefs.current) {
      if (!el) continue;
      ro.observe(el);
    }

    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="min-h-dvh bg-black text-white">
      <style jsx global>{`
        @import url("https://api.fontshare.com/v2/css?f[]=switzer@1&display=swap");
        .font-switzer {
          font-family:
            "Switzer",
            system-ui,
            -apple-system,
            "Segoe UI",
            sans-serif;
        }

        /* Parallax variables */
        .scene {
          --scene-p: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .scene [data-parallax] {
            transform: none !important;
          }
        }
      `}</style>

      <div
        ref={scrollerRef}
        className="font-switzer h-dvh snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        {sections.map((s, idx) => {
          return (
            <div
              key={s.key}
              ref={(el) => {
                sectionRefs.current[idx] = el;
              }}
              className={`scene ${s.bg} snap-start`}
            >
              {/* Give each scene extra runway so the sticky card can "stack" + parallax */}
              <div className="relative h-[200dvh]">
                <div className="sticky top-0 flex h-dvh items-center justify-center p-6">
                  <div
                    className={[
                      "relative w-full max-w-5xl overflow-hidden rounded-4xl border border-white/10 shadow-2xl",
                      "bg-linear-to-br",
                      s.card,
                    ].join(" ")}
                    style={{
                      transform: `translateY(calc(var(--scene-p) * 14px)) scale(calc(1 - (var(--scene-p) * 0.03)))`,
                      transformOrigin: "50% 0%",
                    }}
                    data-parallax
                  >
                    {/* Background parallax layer */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-80"
                      style={{
                        transform: `translateY(calc(var(--scene-p) * -42px))`,
                      }}
                      data-parallax
                    >
                      <div className="absolute top-[-120px] -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
                      <div className="absolute -right-24 bottom-[-120px] h-96 w-96 rounded-full bg-white/10 blur-3xl" />
                    </div>

                    {/* Content */}
                    <div className="relative p-8 md:p-14">
                      <div className="flex items-center justify-between gap-6">
                        <div className="min-w-0">
                          <p className="text-xs font-medium tracking-widest text-white/70">
                            {s.eyebrow.toUpperCase()}
                          </p>
                          <h2 className="mt-3 text-3xl leading-tight font-semibold md:text-5xl">
                            {s.title}
                          </h2>
                          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 md:text-base">
                            {s.description}
                          </p>
                        </div>
                        <div className="hidden shrink-0 md:block">
                          <div className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm text-white/80">
                            {idx + 1} / {sections.length}
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                          <p className="text-sm font-medium">Snap</p>
                          <p className="mt-2 text-sm text-white/70">
                            `snap-y snap-mandatory`
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                          <p className="text-sm font-medium">Stack</p>
                          <p className="mt-2 text-sm text-white/70">
                            Sticky card per section
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                          <p className="text-sm font-medium">Parallax</p>
                          <p className="mt-2 text-sm text-white/70">
                            CSS vars updated on scroll
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
