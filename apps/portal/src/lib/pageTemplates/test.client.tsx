"use client";

import React, { Suspense, useEffect, useRef } from "react";
import Image from "next/image";
import {
  IconBrandGithub,
  IconBrandX,
  IconExchange,
  IconHome,
  IconNewSection,
  IconTerminal2,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { animate, scroll } from "motion";

import { Button } from "@acme/ui/button";
import { FloatingDock } from "@acme/ui/floating-dock";

import type { PageTemplateContext } from "./registry";
import { Card } from "~/components/ui/apple-cards-carousel";
import { LayoutTextFlip } from "~/components/ui/layout-text-flip";
import { WobbleCard } from "~/components/ui/wobble-card";
import { TimelineDemo } from "./DesmondPortfolio/Timeline";
import { RocketScene } from "./RocketScene";

// import { TestHeroScene } from "./TestHeroScene";
// import { TronScene } from "./TronScene";

export const TestHeroTemplate = ({
  post: _post,
  meta: _meta,
}: PageTemplateContext) => {
  const pageRef = useRef<HTMLDivElement>(null);
  const slides = [
    { label: "Slide 1", color: "#0ea5e9" },
    { label: "Slide 2", color: "#10b981" },
    { label: "Slide 3", color: "#f59e0b" },
    { label: "Slide 4", color: "#ef4444" },
    { label: "Slide 5", color: "#8b5cf6" },
    { label: "Slide 6", color: "#8b5cf6" },
  ];
  const links = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },

    {
      title: "Products",
      icon: (
        <IconTerminal2 className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Components",
      icon: (
        <IconNewSection className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Aceternity UI",
      icon: (
        <Image
          src="https://assets.aceternity.com/logo-dark.png"
          width={20}
          height={20}
          alt="Aceternity Logo"
        />
      ),
      href: "#",
    },
    {
      title: "Changelog",
      icon: (
        <IconExchange className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },

    {
      title: "Twitter",
      icon: (
        <IconBrandX className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "GitHub",
      icon: (
        <IconBrandGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
  ];
  const DummyContent = () => {
    return (
      <>
        {Array.from({ length: 3 }).map((_, index) => {
          return (
            <div
              key={"dummy-content" + index}
              className="mb-4 rounded-3xl bg-[#F5F5F7] p-8 md:p-14 dark:bg-neutral-800"
            >
              <p className="mx-auto max-w-3xl font-sans text-base text-neutral-600 md:text-2xl dark:text-neutral-400">
                <span className="font-bold text-neutral-700 dark:text-neutral-200">
                  The first rule of Apple club is that you boast about Apple
                  club.
                </span>{" "}
                Keep a journal, quickly jot down a grocery list, and take
                amazing class notes. Want to convert those notes to text? No
                problem. Langotiya jeetu ka mara hua yaar is ready to capture
                every thought.
              </p>
              <Image
                src="https://assets.aceternity.com/macbook.png"
                alt="Macbook mockup from Aceternity UI"
                height={500}
                width={500}
                className="mx-auto h-full w-full object-contain md:h-1/2 md:w-1/2"
              />
            </div>
          );
        })}
      </>
    );
  };

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

  const data = [
    {
      category: "Artificial Intelligence",
      title: "You can do more with AI.",
      src: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=3556&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      content: <DummyContent />,
    },
    {
      category: "Productivity",
      title: "Enhance your productivity.",
      src: "https://images.unsplash.com/photo-1531554694128-c4c6665f59c2?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      content: <DummyContent />,
    },
    {
      category: "Product",
      title: "Launching the new Apple Vision Pro.",
      src: "https://images.unsplash.com/photo-1713869791518-a770879e60dc?q=80&w=2333&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      content: <DummyContent />,
    },

    {
      category: "Product",
      title: "Maps for your iPhone 15 Pro Max.",
      src: "https://images.unsplash.com/photo-1599202860130-f600f4948364?q=80&w=2515&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      content: <DummyContent />,
    },
    {
      category: "iOS",
      title: "Photography just got better.",
      src: "https://images.unsplash.com/photo-1602081957921-9137a5d6eaee?q=80&w=2793&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      content: <DummyContent />,
    },
    {
      category: "Hiring",
      title: "Hiring for a Staff Software Engineer",
      src: "https://images.unsplash.com/photo-1511984804822-e16ba72f5848?q=80&w=2048&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      content: <DummyContent />,
    },
  ];

  const _cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
  ));
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const group = container?.querySelector(".img-group") as HTMLElement | null;
    const items = container?.querySelectorAll(".img-container");
    console.log("items", items);
    const progress = progressRef.current;

    const distance = slides.length * 72.5;
    console.log("distance", distance);

    if (!container || !group || !items || items.length === 0) return;

    const cancelGallery = scroll(
      animate(group, {
        transform: ["translateX(0)", `translateX(-${slides.length * 70.83}vw)`],
      }),
      { target: container },
    );

    const cancelProgress = progress
      ? scroll(animate(progress, { scaleX: [0, 1] }), { target: container })
      : undefined;

    return () => {
      cancelGallery();
      cancelProgress?.();
    };
  }, []);

  return (
    <>
      {/* Section 1 (sticky) */}
      <style>{css}</style>
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
        <section className="img-group-container relative h-[200vh]">
          <div className="sticky top-0 h-screen items-center justify-center overflow-hidden py-10">
            <h2 className="text-center text-3xl font-semibold">Section 3</h2>
            <ul
              className="img-group flex w-auto overflow-hidden"
              style={{ width: `${slides.length * 100}%` }}
            >
              {slides.map((slide) => (
                <li
                  key={slide.label}
                  className="img-container flex h-screen w-full flex-col items-center justify-center"
                >
                  <img src={slide.src} />
                  <h3>{slide.label}</h3>
                </li>
              ))}
            </ul>
          </div>
        </section>
        {/* <footer className="flex items-center justify-center">
          <p>
            Photos by
            <a target="_blank" href="https://twitter.com/mattgperry">
              Matt Perry
            </a>
          </p>
        </footer> */}
      </article>
      <section
        className="relative flex min-h-screen items-center justify-center bg-slate-900 text-white"
        style={{ position: "sticky", top: 0, zIndex: 50 }}
      >
        <h1 className="text-4xl font-bold">Section 4</h1>
      </section>
      <section
        className="relative flex min-h-screen items-center justify-center bg-green-500 text-white"
        style={{ position: "sticky", top: 0, zIndex: 60 }}
      >
        <h1 className="text-4xl font-bold">Section 5</h1>
      </section>
      {/* <div ref={progressRef} className="progress"></div> */}
      {/* Hero Section - Layer 1 (z-50) */}
      {/* <section className="sticky top-0 min-h-screen" style={{ zIndex: 10 }}>
        <div className="parallax-section h-full">
          <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-hidden">
         
            <div className="absolute inset-0 z-0">
              <Suspense fallback={null}>
                <RocketScene />
              </Suspense>
            </div>

            {/* Overlay gradient for better text readability */}
      {/* <div className="absolute inset-0 z-10 bg-linear-to-b from-black/60 via-black/40 to-black/60" /> 

            <div className="relative z-20 flex w-full max-w-5xl">
              <div className="z-20 flex w-full flex-col items-start justify-center gap-3">
                <h2 className="relative z-10 max-w-4xl text-center text-2xl font-bold text-white md:text-2xl lg:text-5xl">
                  Desmond Tatilian
                </h2>

                <motion.div className="relative flex flex-col items-center justify-center gap-4 text-center sm:mx-0 sm:mb-0 sm:flex-row">
                  <LayoutTextFlip
                    text="I build "
                    words={[
                      "amazing products",
                      "immersive experiences",
                      "engaging interfaces",
                    ]}
                    className="md:text-md text-white"
                  />
                </motion.div>
                <p className="text-white/90">
                  Description of the product or service
                </p>
                <div className="mt-4 flex gap-3">
                  <Button>View Portfolio</Button>
                  <Button>View Portfolio</Button>
                  <Button>View Portfolio</Button>
                </div>
              </div>
            </div>
            {/* <BackgroundRippleEffect /> 
          </div>
        </div>
      </section> */}

      {/* Wobble Cards - Layer 3 (z-30) */}
      {/* <section
        className="sticky top-0 min-h-screen bg-white dark:bg-black"
        style={{ zIndex: 30 }}
      >
        <div className="parallax-section flex h-full items-center justify-center p-8">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-3">
            <WobbleCard
              containerClassName="col-span-1 lg:col-span-2 h-full bg-pink-800 min-h-[500px] lg:min-h-[300px]"
              className=""
            >
              <div className="max-w-xs">
                <h2 className="text-left text-base font-semibold tracking-[-0.015em] text-balance text-white md:text-xl lg:text-3xl">
                  Gippity AI powers the entire universe
                </h2>
                <p className="mt-4 text-left text-base/6 text-neutral-200">
                  With over 100,000 mothly active bot users, Gippity AI is the
                  most popular AI platform for developers.
                </p>
              </div>
              <Image
                src="/linear.webp"
                width={500}
                height={500}
                alt="linear demo image"
                className="absolute -right-4 -bottom-10 rounded-2xl object-contain grayscale filter lg:-right-[40%]"
              />
            </WobbleCard>
            <WobbleCard containerClassName="col-span-1 min-h-[300px]">
              <h2 className="max-w-80 text-left text-base font-semibold tracking-[-0.015em] text-balance text-white md:text-xl lg:text-3xl">
                No shirt, no shoes, no weapons.
              </h2>
              <p className="mt-4 max-w-104 text-left text-base/6 text-neutral-200">
                If someone yells "stop!", goes limp, or taps out, the fight is
                over.
              </p>
            </WobbleCard>
            <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-blue-900 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]">
              <div className="max-w-sm">
                <h2 className="max-w-sm text-left text-base font-semibold tracking-[-0.015em] text-balance text-white md:max-w-lg md:text-xl lg:text-3xl">
                  Signup for blazing-fast cutting-edge state of the art Gippity
                  AI wrapper today!
                </h2>
                <p className="mt-4 max-w-104 text-left text-base/6 text-neutral-200">
                  With over 100,000 mothly active bot users, Gippity AI is the
                  most popular AI platform for developers.
                </p>
              </div>
              <Image
                src="/linear.webp"
                width={500}
                height={500}
                alt="linear demo image"
                className="absolute -right-10 -bottom-10 rounded-2xl object-contain md:-right-[40%] lg:-right-[20%]"
              />
            </WobbleCard>
          </div>
        </div>
      </section> */}

      {/* Timeline - Layer 4 (z-20) */}
      {/* <section
        className="sticky top-0 min-h-screen bg-white dark:bg-black"
        style={{ zIndex: 70 }}
      >
        <div className="h-full">
          <TimelineDemo />
        </div>
      </section> */}

      {/* Floating Dock */}
      {/* <div className="fixed bottom-5 z-50 flex w-full justify-center">
        <FloatingDock
          mobileClassName="translate-y-20" // only for demo, remove for production
          items={links}
        />
      </div> */}
    </>
  );
};
