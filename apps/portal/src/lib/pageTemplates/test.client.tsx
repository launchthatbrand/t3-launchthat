"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis } from "lenis/react";
import { useMotionValue } from "motion/react";

import { Boxes } from "~/components/ui/background-boxes";
import {
  Keypad,
  Lid,
  SpeakerGrid,
  Trackpad,
} from "~/components/ui/macbook-scroll";
import { ScrollRevealLines } from "~/components/ui/scroll-text";
import musicRoomBg from "~/lib/pageTemplates/Music-Room-Copy-12-21-2025_10_07_PM.jpg";

gsap.registerPlugin(ScrollTrigger);

type ScrollDirection = "vertical" | "horizontal" | null;

export function TestHeroTemplate() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lidScreenElRef = useRef<HTMLDivElement | null>(null);
  const lidScaleX = useMotionValue(1.25);
  const lidScaleY = useMotionValue(1.25);
  const lidRotate = useMotionValue(-25);
  const lidTranslate = useMotionValue(0);

  const initScroll = useCallback(
    (
      section: HTMLElement,
      items: HTMLElement[],
      direction: ScrollDirection,
    ): (() => void) | void => {
      if (!direction) return;
      if (items.length <= 1) return;

      const wrapper = section.querySelector<HTMLElement>(".wrapper");
      if (!wrapper) return;

      const axis = direction === "vertical" ? "yPercent" : "xPercent";

      gsap.set(wrapper, { position: "relative", overflow: "hidden" });
      gsap.set(items, {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      });
      gsap.set(items, { scale: 1, transformOrigin: "50% 50%" });

      // Ensure items stack predictably (later items above earlier).
      items.forEach((item, index) => {
        item.style.zIndex = String(index);
      });

      items.forEach((item, index) => {
        gsap.set(item, { [axis]: index === 0 ? 0 : 100 });
      });

      // Optional: special horizontal scroll inside a vertical section (Item 3).
      const hItem =
        direction === "vertical"
          ? items.find((item) => item.dataset.hscroll === "true")
          : undefined;
      const hViewport = hItem?.querySelector<HTMLElement>(".hscroll-viewport");
      const hTrack = hItem?.querySelector<HTMLElement>(".hscroll-track");
      const hMaxX =
        hViewport && hTrack
          ? Math.max(0, hTrack.scrollWidth - hViewport.clientWidth)
          : 0;

      // Optional: special vertical scroll inside a vertical section (Item 2).
      const vItem =
        direction === "vertical"
          ? items.find((item) => item.dataset.vscroll === "true")
          : undefined;
      const vViewport = vItem?.querySelector<HTMLElement>(".vscroll-viewport");
      const vTrack = vItem?.querySelector<HTMLElement>(".vscroll-track");
      const vLabel = vItem?.querySelector<HTMLElement>(".vscroll-active-label");
      const vIntro = vItem?.querySelector<HTMLElement>(".vscroll-intro");
      const vLayout = vItem?.querySelector<HTMLElement>(".vscroll-layout");
      const vCards = vTrack
        ? Array.from(vTrack.querySelectorAll<HTMLElement>(".vscroll-card"))
        : [];
      const vMaxY =
        vViewport && vTrack
          ? Math.max(0, vTrack.scrollHeight - vViewport.clientHeight)
          : 0;
      const baseStepPx = wrapper.clientHeight || window.innerHeight;
      const vIntroUnits = vItem ? 0.75 : 0;

      if (vIntro && vLayout) {
        gsap.set(vIntro, { autoAlpha: 1 });
        gsap.set(vLayout, { autoAlpha: 0 });
      }

      // Optional: special expand-to-fullscreen slide (Item 8) from the center of Item 7.
      const expandOriginItem =
        direction === "vertical"
          ? items.find((item) => item.dataset.expandOrigin === "true")
          : undefined;
      const expandItem =
        direction === "vertical"
          ? items.find((item) => item.dataset.expand === "true")
          : undefined;
      const expandLayer =
        section.querySelector<HTMLElement>(".expand-layer") ??
        expandItem?.querySelector<HTMLElement>(".expand-layer");

      // If the expand layer lives inside a transformed slide, "fixed" breaks.
      // We temporarily portal it to the pinned `section` so its positioning math
      // stays consistent for the whole experience.
      let restoreExpandLayer: (() => void) | undefined;
      if (expandLayer?.parentElement && expandLayer.parentElement !== section) {
        const originalParent = expandLayer.parentElement;
        const placeholder = document.createComment("expand-layer-placeholder");
        originalParent.insertBefore(placeholder, expandLayer);
        section.appendChild(expandLayer);
        restoreExpandLayer = () => {
          placeholder.parentNode?.insertBefore(expandLayer, placeholder);
          placeholder.remove();
        };
      }
      const expandBaseZ =
        expandItem?.style.zIndex && expandItem.style.zIndex.length > 0
          ? Number(expandItem.style.zIndex)
          : expandItem
            ? items.indexOf(expandItem)
            : 0;

      if (expandLayer) {
        gsap.set(expandLayer, {
          // We'll lock this layer to the Lid screen bounds via getBoundingClientRect(),
          // then expand it to full viewport. Start hidden but don't animate opacity.
          autoAlpha: 0,
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          zIndex: expandBaseZ,
          transformPerspective: 800,
          rotateX: -25,
          // Match the Lid "screen" behavior (it hinges from the top edge).
          transformOrigin: "50% 0%",
          borderRadius: "24px",
          force3D: true,
        });
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // Scroll distance: one viewport per vertical transition + extra pixels for
          // internal horizontal/vertical scroll + an intro->layout reveal in Item 2
          // + a special expand transition at the end.
          end: () =>
            `+=${baseStepPx * (items.length - 1 + vIntroUnits) + hMaxX + vMaxY}`,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // IMPORTANT: ensure the expand layer is timeline-controlled so scrubbing
      // back up doesn't leave an invisible overlay blocking pointer events.
      if (expandLayer) {
        tl.set(expandLayer, { autoAlpha: 0, pointerEvents: "none" }, 0);
      }

      let cursor = 0;
      for (let index = 1; index < items.length; index++) {
        const prev = items[index - 1];
        const next = items[index];
        if (!prev || !next) continue;

        const transitionStart = cursor;

        const isExpandTransition =
          prev.dataset.expandOrigin === "true" &&
          next.dataset.expand === "true";

        const syncExpandLayerToLid = () => {
          if (!expandLayer) return;
          const screenEl = lidScreenElRef.current;
          if (!screenEl) return;
          const rect = screenEl.getBoundingClientRect();
          const anchorRect = section.getBoundingClientRect();
          gsap.set(expandLayer, {
            top: rect.top - anchorRect.top,
            left: rect.left - anchorRect.left,
            width: rect.width,
            height: rect.height,
          });
        };

        // Slide 8 should "come in" with Slide 7 (already visible, scaled down),
        // then expand to fullscreen on the 7->8 transition.
        if (next === expandOriginItem && expandItem && expandLayer) {
          // Make it visible and keep it *glued* to the Lid screen rect while Slide 7 is moving in.
          tl.set(
            expandLayer,
            {
              autoAlpha: 1,
              pointerEvents: "auto",
              rotateX: -25,
              borderRadius: "16px",
              // Temporarily float above the stack during the "lid locked" phase.
              zIndex: 9999,
            },
            transitionStart,
          );
          tl.call(syncExpandLayerToLid, undefined, transitionStart);
          tl.to(
            {},
            {
              duration: 1,
              ease: "none",
              onUpdate: syncExpandLayerToLid,
            },
            transitionStart,
          );
        }

        if (isExpandTransition && expandLayer) {
          // Slide 8: expand from the center of Slide 7 to fullscreen (no fade).
          tl.set(next, { [axis]: 0 }, transitionStart);
          // Ensure the starting rect is correct at the exact moment we begin expanding.
          tl.call(syncExpandLayerToLid, undefined, transitionStart);
          tl.to(
            expandLayer,
            {
              top: "20px",
              left: "20px",
              right: "20px",
              bottom: "20px",
              width: () => section.getBoundingClientRect().width,
              height: () => section.getBoundingClientRect().height,
              rotateX: 0,
              borderRadius: "30px",
              duration: 1,
            },
            transitionStart,
          );
          // After the expand completes, drop Slide 8 back into normal stacking order
          // so the next slide (e.g. Section 9) can slide on top.
          tl.set(
            expandLayer,
            { zIndex: expandBaseZ, pointerEvents: "none" },
            transitionStart + 1,
          );
        } else {
          // Default: Keep the previous item "stuck" in place while the next one scrolls in.
          tl.to(next, { [axis]: 0, duration: 1 }, transitionStart);
        }

        // Shrink the previous item as the next one scrolls in.
        const isFirstItem = prev === items[0];
        const prevScale = isFirstItem ? 0.75 : 0.9;
        tl.to(
          prev,
          {
            scale: prevScale,
            duration: 1,
          },
          transitionStart,
        );
        cursor += 1;

        // While Item 3 is active, scrub its internal horizontal track.
        if (next === hItem && hTrack && hMaxX > 0) {
          const hUnits = Math.max(0.001, hMaxX / baseStepPx);
          tl.to(
            hTrack,
            {
              x: -hMaxX,
              ease: "none",
              duration: hUnits,
            },
            cursor,
          );
          cursor += hUnits;
        }

        // While Item 2 is active, scrub its internal vertical track.
        if (next === vItem && vTrack && vMaxY > 0) {
          if (vIntro && vLayout) {
            // First: show only the intro text, then fade it out and reveal the layout.
            tl.to(vIntro, { autoAlpha: 0, duration: vIntroUnits }, cursor).to(
              vLayout,
              { autoAlpha: 1, duration: vIntroUnits },
              cursor,
            );
            cursor += vIntroUnits;
          } else if (vLayout) {
            // Safety: if intro is missing, ensure layout is visible.
            tl.set(vLayout, { autoAlpha: 1 }, cursor);
          }

          const vUnits = Math.max(0.001, vMaxY / baseStepPx);
          let lastActiveCardIndex = -1;

          const updateVLabel = () => {
            if (!vLabel) return;
            if (!vCards.length) return;

            const y = Number(gsap.getProperty(vTrack, "y"));
            let bestDistance = Number.POSITIVE_INFINITY;
            let activeIndex = 0;

            for (let cardIndex = 0; cardIndex < vCards.length; cardIndex++) {
              const card = vCards[cardIndex];
              if (!card) continue;

              const distance = Math.abs(card.offsetTop + y);
              if (distance < bestDistance) {
                bestDistance = distance;
                activeIndex = cardIndex;
              }
            }

            if (activeIndex !== lastActiveCardIndex) {
              vLabel.textContent = `Card ${activeIndex + 1}`;
              lastActiveCardIndex = activeIndex;
            }
          };

          tl.to(
            vTrack,
            {
              y: -vMaxY,
              ease: "none",
              duration: vUnits,
              onStart: () => {
                if (vLabel && vCards.length) vLabel.textContent = "Card 1";
                updateVLabel();
              },
              onUpdate: updateVLabel,
            },
            cursor,
          );
          cursor += vUnits;
        }
      }

      return () => restoreExpandLayer?.();
    },
    [],
  );

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // HMR-safe: remember which ScrollTriggers existed before we mount ours.
    const before = new Set(ScrollTrigger.getAll());

    let cleanupInitScroll: (() => void) | void;
    const ctx = gsap.context(() => {
      const wrapper = root.querySelector<HTMLElement>(".wrapper");
      if (!wrapper) return;

      const items = Array.from(wrapper.querySelectorAll<HTMLElement>(".item"));
      if (!items.length) return;

      let direction: ScrollDirection = null;
      if (root.classList.contains("vertical-section")) {
        direction = "vertical";
      } else if (root.classList.contains("horizontal-section")) {
        direction = "horizontal";
      }

      cleanupInitScroll = initScroll(root, items, direction);
    }, root);

    // Only clean up ScrollTriggers created by this render.
    const created = ScrollTrigger.getAll().filter((t) => !before.has(t));

    return () => {
      // Kill triggers first (removes pin spacers), then revert GSAP styles.
      created.forEach((t) => t.kill(true));
      cleanupInitScroll?.();
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, [initScroll]);

  return (
    <ReactLenis root>
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
      `}</style>
      <div>
        <div
          ref={containerRef}
          className="scroll-section vertical-section section"
        >
          <div className="wrapper h-dvh bg-black p-10">
            <div role="list" className="list h-full">
              <div
                role="listitem"
                style={{
                  backgroundImage: `url(${musicRoomBg.src})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                className="item relative flex h-full items-center justify-center overflow-hidden bg-black"
              >
                {/* <Image
                  alt=""
                  src={musicRoomBg}
                  fill
                  priority
                  className="object-cover"
                /> */}
                {/* <div className="absolute inset-0 bg-black/50" /> */}
                <ScrollRevealLines
                  lines={["DESMOND", "TATILIAN"]}
                  // progress={progress}
                  containerClassName=""
                  className="h-full text-center leading-[0.82] font-black tracking-[-0.06em] text-red-600 uppercase"
                  lineClassName="text-[clamp(3rem,6vw,8.25rem)]"
                  yFrom={28}
                  stagger={0.14}
                />
              </div>
              <div
                role="listitem"
                data-vscroll="true"
                className="item flex h-full items-center justify-center p-5"
              >
                <div className="rounded-3x flex h-full w-full items-center justify-center shadow-[0_0_10px_0_rgba(0,0,0,0.5)]">
                  <div className="item-content relative h-full w-full overflow-hidden rounded-3xl bg-slate-900 p-10">
                    {/* <div className="pointer-events-none absolute inset-0 z-20 h-full w-full bg-slate-900 mask-[radial-gradient(transparent,white)]" /> */}
                    <Boxes className="opacity-40" />
                    <div className="vscroll-intro pointer-events-none absolute inset-0 flex items-center justify-center p-10">
                      <ScrollRevealLines
                        lines={["WHAT I'VE", "BEEN WORKING", "ON"]}
                        // progress={progress}
                        containerClassName=""
                        className="text-center leading-[0.82] font-black tracking-[-0.06em] text-red-600 uppercase"
                        lineClassName="text-[clamp(3rem,6vw,8.25rem)]"
                        yFrom={28}
                        stagger={0.14}
                      />
                    </div>

                    <div className="vscroll-layout pointer-events-none absolute inset-0 z-10 grid h-full gap-8 p-10 md:grid-cols-12">
                      <div className="col-span-4">
                        <div className="sticky top-10 space-y-3">
                          <div className="text-sm font-medium text-black/80">
                            Active:{" "}
                            <span className="vscroll-active-label">Card 1</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-8 min-h-0">
                        <div className="vscroll-viewport h-full overflow-hidden">
                          <div className="vscroll-track flex w-full flex-col gap-6 will-change-transform">
                            <div className="vscroll-card h-[60vh] w-full rounded-3xl bg-white/80 p-8">
                              <h2 className="text-2xl font-semibold">Card 1</h2>
                              <p className="mt-2 text-sm opacity-80">
                                Some content…
                              </p>
                            </div>
                            <div className="vscroll-card h-[60vh] w-full rounded-3xl bg-white/80 p-8">
                              <h2 className="text-2xl font-semibold">Card 2</h2>
                              <p className="mt-2 text-sm opacity-80">
                                Some content…
                              </p>
                            </div>
                            <div className="vscroll-card h-[60vh] w-full rounded-3xl bg-white/80 p-8">
                              <h2 className="text-2xl font-semibold">Card 3</h2>
                              <p className="mt-2 text-sm opacity-80">
                                Some content…
                              </p>
                            </div>
                            <div className="vscroll-card h-[60vh] w-full rounded-3xl bg-white/80 p-8">
                              <h2 className="text-2xl font-semibold">Card 4</h2>
                              <p className="mt-2 text-sm opacity-80">
                                Some content…
                              </p>
                            </div>
                            <div className="vscroll-card h-[60vh] w-full rounded-3xl bg-white/80 p-8">
                              <h2 className="text-2xl font-semibold">Card 5</h2>
                              <p className="mt-2 text-sm opacity-80">
                                Some content…
                              </p>
                            </div>
                            <div className="vscroll-card h-[60vh] w-full rounded-3xl bg-white/80 p-8">
                              <h2 className="text-2xl font-semibold">Card 6</h2>
                              <p className="mt-2 text-sm opacity-80">
                                Some content…
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                role="listitem"
                data-hscroll="true"
                className="item flex h-full items-center justify-center p-5"
              >
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-3xl bg-green-300 shadow-[0_0_10px_0_rgba(0,0,0,0.5)]">
                  <div className="item-content flex h-full w-full flex-col gap-6">
                    <ScrollRevealLines
                      lines={["SECTION THREE"]}
                      // progress={progress}
                      containerClassName=""
                      className="p-10 text-center leading-[0.82] font-black tracking-[-0.06em] text-red-600 uppercase"
                      lineClassName="text-[clamp(3rem,10vw,8.25rem)]"
                      yFrom={28}
                      stagger={0.14}
                    />

                    <div className="hscroll-viewport flex-1 overflow-hidden">
                      <div className="hscroll-track flex h-full w-max gap-6 will-change-transform">
                        <div className="h-full w-[60vw] shrink-0 rounded-3xl bg-white/80 p-8">
                          <h2 className="text-2xl font-semibold">Card 1</h2>
                          <p className="mt-2 text-sm opacity-80">
                            Some content…
                          </p>
                        </div>
                        <div className="h-full w-[60vw] shrink-0 rounded-3xl bg-white/80 p-8">
                          <h2 className="text-2xl font-semibold">Card 2</h2>
                          <p className="mt-2 text-sm opacity-80">
                            Some content…
                          </p>
                        </div>
                        <div className="h-full w-[60vw] shrink-0 rounded-3xl bg-white/80 p-8">
                          <h2 className="text-2xl font-semibold">Card 3</h2>
                          <p className="mt-2 text-sm opacity-80">
                            Some content…
                          </p>
                        </div>
                        <div className="h-full w-[60vw] shrink-0 rounded-3xl bg-white/80 p-8">
                          <h2 className="text-2xl font-semibold">Card 4</h2>
                          <p className="mt-2 text-sm opacity-80">
                            Some content…
                          </p>
                        </div>
                        <div className="h-full w-[60vw] shrink-0 rounded-3xl bg-white/80 p-8">
                          <h2 className="text-2xl font-semibold">Card 5</h2>
                          <p className="mt-2 text-sm opacity-80">
                            Some content…
                          </p>
                        </div>
                        <div className="h-full w-[60vw] shrink-0 rounded-3xl bg-white/80 p-8">
                          <h2 className="text-2xl font-semibold">Card 6</h2>
                          <p className="mt-2 text-sm opacity-80">
                            Some content…
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                role="listitem"
                className="item flex h-full items-center justify-center p-5"
              >
                <div className="flex h-full w-full items-center justify-center rounded-3xl bg-red-300 shadow-[0_0_10px_0_rgba(0,0,0,0.5)]">
                  <ScrollRevealLines
                    lines={["SECTION FOUR"]}
                    // progress={progress}
                    containerClassName=""
                    className="text-center leading-[0.82] font-black tracking-[-0.06em] text-red-600 uppercase"
                    lineClassName="text-[clamp(3rem,10vw,8.25rem)]"
                    yFrom={28}
                    stagger={0.14}
                  />
                </div>
              </div>

              {/* Slide 7: normal slide-in */}
              <div
                role="listitem"
                data-expand-origin="true"
                className="item relative flex h-full items-center justify-center overflow-hidden p-5"
              >
                <div className="relative z-10 flex h-full w-full items-center justify-center rounded-3xl bg-green-600 shadow-[0_0_10px_0_rgba(0,0,0,0.5)] backdrop-blur-md">
                  <div className="flex flex-col items-center">
                    <Lid
                      scaleX={lidScaleX}
                      scaleY={lidScaleY}
                      rotate={lidRotate}
                      translate={lidTranslate}
                      screenElRef={lidScreenElRef}
                    />
                    {/* Base area */}
                    <div className="relative h-88 w-lg overflow-hidden rounded-2xl bg-gray-200 dark:bg-[#272729]">
                      {/* above keyboard bar */}
                      <div className="relative h-10 w-full">
                        <div className="absolute inset-x-0 mx-auto h-4 w-[80%] bg-[#050505]" />
                      </div>
                      <div className="relative flex">
                        <div className="mx-auto h-full w-[10%] overflow-hidden">
                          <SpeakerGrid />
                        </div>
                        <div className="mx-auto h-full w-[80%]">
                          <Keypad />
                        </div>
                        <div className="mx-auto h-full w-[10%] overflow-hidden">
                          <SpeakerGrid />
                        </div>
                      </div>
                      <Trackpad />
                      <div className="absolute inset-x-0 bottom-0 mx-auto h-2 w-20 rounded-tl-3xl rounded-tr-3xl bg-linear-to-t from-[#272729] to-[#050505]" />
                      {/* {showGradient && (
                      <div className="absolute inset-x-0 bottom-0 z-50 h-40 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black"></div>
                    )}
                    {badge && (
                      <div className="absolute bottom-4 left-4">{badge}</div>
                    )} */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 8: expands from the center of Slide 7 to fullscreen */}
              <div
                role="listitem"
                data-expand="true"
                className="item relative flex h-full items-center justify-center p-5"
              >
                <div
                  className="expand-layer fixed overflow-hidden rounded-3xl bg-black p-5"
                  style={{
                    backgroundImage: `url(${musicRoomBg.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="relative z-10 flex h-full w-full items-center justify-center px-10">
                    <ScrollRevealLines
                      lines={["SECTION", "EIGHT"]}
                      containerClassName=""
                      className="text-center leading-[0.82] font-black tracking-[-0.06em] text-red-600 uppercase"
                      lineClassName="text-[clamp(3rem,10vw,8.25rem)]"
                      yFrom={28}
                      stagger={0.14}
                    />
                  </div>
                </div>
              </div>

              <div
                role="listitem"
                className="item justify-cente z-100 flex h-full items-center p-5"
              >
                <div className="flex h-full w-full items-center justify-center rounded-3xl border border-dashed border-white bg-black shadow-[0_0_10px_0_rgba(0,0,0,0.5)]">
                  <ScrollRevealLines
                    lines={["THANKS", "FOR YOUR", "ATTENTION", "LETS TALK"]}
                    // progress={progress}
                    containerClassName=""
                    className="text-center leading-[0.82] font-black tracking-[-0.06em] text-red-600 uppercase"
                    lineClassName="text-[clamp(3rem,10vw,8.25rem)]"
                    yFrom={28}
                    stagger={0.14}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReactLenis>
  );
}
