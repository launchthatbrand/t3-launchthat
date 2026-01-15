"use client";

import React, { useEffect, useRef } from "react";
import { animate, scroll } from "motion";

const slides = [
  { label: "Slide 1", color: "#0ea5e9" },
  { label: "Slide 2", color: "#10b981" },
  { label: "Slide 3", color: "#f59e0b" },
  { label: "Slide 4", color: "#ef4444" },
  { label: "Slide 5", color: "#8b5cf6" },
];

export default function FramerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const group = container?.querySelector(".img-group") as HTMLElement | null;
    const items = container?.querySelectorAll(".img-container");
    const progress = progressRef.current;

    if (!container || !group || !items || items.length === 0) return;

    const distance = (items.length - 1) * 100;

    const cancelGallery = scroll(
      animate(group, {
        transform: ["none", `translateX(-${distance}vw)`],
      }),
      { target: container, offset: ["start start", "end end"] },
    );

    const cancelProgress = progress
      ? scroll(animate(progress, { scaleX: [0, 1] }), { target: container })
      : undefined;

    return () => {
      cancelGallery();
      cancelProgress?.();
    };
  }, []);

  const css = `

    .img-container h3 {
        margin: 0;
        font-size: 50px;
        font-weight: 700;
        letter-spacing: -3px;
        line-height: 1.2;
        position: relative;
        bottom: 30px;
        display: inline-block;
    }

    .img-container img {
        width: 300px;
        height: 400px;
    }

    .progress {
        position: fixed;
        left: 0;
        right: 0;
        height: 5px;
        background: #9911ff;
        bottom: 50px;
        transform: scaleX(0);
    }
`;

  return (
    <>
      <style>{css}</style>

      {/* Section 1 (sticky) */}
      <section
        className="relative flex min-h-screen items-center justify-center bg-slate-900 text-white"
        style={{ position: "sticky", top: 0, zIndex: 30 }}
      >
        <h1 className="text-4xl font-bold">Section 1</h1>
      </section>

      {/* Section 2 (sticky) */}
      <section
        className="relative flex min-h-screen items-center justify-center bg-slate-800 text-white"
        style={{ position: "sticky", top: 0, zIndex: 35 }}
      >
        <h2 className="text-3xl font-semibold">Section 2</h2>
      </section>

      <article
        id="gallery"
        className="bg-red-500"
        style={{ position: "sticky", zIndex: 40 }}
        ref={containerRef}
      >
        <section className="img-group-container relative h-[500vh]">
          <div className="sticky top-0 h-screen items-center justify-center overflow-hidden py-10">
            <h2 className="text-center text-3xl font-semibold">Section 3</h2>
            <ul
              className="img-group flex"
              style={{ width: `${slides.length * 100}vw` }}
            >
              <li className="img-container flex h-screen w-screen flex-col items-center justify-center">
                <img src="/photos/cityscape/1.jpg" />
                <h3>#001</h3>
              </li>
              <li className="img-container flex h-screen w-screen flex-col items-center justify-center">
                <img src="/photos/cityscape/2.jpg" />
                <h3>#002</h3>
              </li>
              <li className="img-container flex h-screen w-screen flex-col items-center justify-center">
                <img src="/photos/cityscape/3.jpg" />
                <h3>#003</h3>
              </li>
              <li className="img-container flex h-screen w-screen flex-col items-center justify-center">
                <img src="/photos/cityscape/4.jpg" />
                <h3>#004</h3>
              </li>
              <li className="img-container flex h-screen w-screen flex-col items-center justify-center">
                <img src="/photos/cityscape/5.jpg" />
                <h3>#005</h3>
              </li>
            </ul>
          </div>
        </section>
        <footer className="flex items-center justify-center">
          <p>
            Photos by
            <a target="_blank" href="https://twitter.com/mattgperry">
              Matt Perry
            </a>
          </p>
        </footer>
      </article>
      <div ref={progressRef} className="progress"></div>

      {/* Section 3 */}
      <section
        className="flex min-h-screen items-center justify-center bg-slate-800 text-white"
        style={{ position: "sticky", top: 0, zIndex: 45 }}
      >
        <h2 className="text-3xl font-semibold">Section 3</h2>
      </section>

      {/* Section 4 */}
      <section
        className="flex min-h-screen items-center justify-center bg-slate-900 text-white"
        style={{ position: "sticky", top: 0, zIndex: 50 }}
      >
        <h2 className="text-3xl font-semibold">Section 4</h2>
      </section>
    </>
  );
}
