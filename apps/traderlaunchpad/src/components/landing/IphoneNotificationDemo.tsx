"use client";

import {
  AnimatedList,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  IphoneMock,
} from "@acme/ui";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { NotificationTile } from "./NotificationTile";
import type { PhoneNotification } from "./NotificationTile";
import { TraderLaunchpadMobileMock } from "./TraderLaunchpadMobileMock";
import type { TraderLaunchpadMobileRoute } from "./TraderLaunchpadMobileMock";
import { XIcon } from "lucide-react";
import { demoNotifications } from "@acme/demo-data";
import { motion } from "motion/react";

export const IphoneNotificationDemo = () => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    // Align updates to the next minute tick, then update once per minute.
    let interval: number | null = null;
    const schedule = () => {
      const d = new Date();
      const msUntilNextMinute =
        (60 - d.getSeconds()) * 1000 - d.getMilliseconds();
      window.setTimeout(
        () => {
          setNow(new Date());
          interval = window.setInterval(() => setNow(new Date()), 60_000);
        },
        Math.max(0, msUntilNextMinute),
      );
    };

    schedule();
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const timeText = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(now);
    } catch {
      const h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }
  }, [now]);

  const dateText = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now);
    } catch {
      return now.toDateString();
    }
  }, [now]);

  const notifications = useMemo<PhoneNotification[]>(
    () => demoNotifications as unknown as PhoneNotification[],
    [],
  );

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<PhoneNotification | null>(null);
  const [origin, setOrigin] = useState<{
    x: number;
    y: number;
    scale: number;
    radius: number;
  }>({ x: 0, y: 0, scale: 0.35, radius: 18 });
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimeoutRef = useRef<number | null>(null);

  const screenRef = useRef<HTMLDivElement | null>(null);
  const [scene, setScene] = useState<"lock" | "app">("lock");
  const [appRoute, setAppRoute] = useState<TraderLaunchpadMobileRoute>({
    kind: "tab",
    tab: "home",
  });
  const [appOrigin, setAppOrigin] = useState<{
    x: number;
    y: number;
    scale: number;
    radius: number;
  }>({ x: 0, y: 0, scale: 0.35, radius: 22 });

  const handleNotificationInfoClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    n: PhoneNotification,
  ) => {
    setSelected(n);
    // Animate from the clicked tile's rect (much more "native" than cursor).
    const rect = e.currentTarget.getBoundingClientRect();
    const rectCenterX = rect.left + rect.width / 2;
    const rectCenterY = rect.top + rect.height / 2;
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    // Approximate target dialog size (matches DialogContent classes).
    const isSmUp =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 640px)").matches;
    const targetW = isSmUp ? window.innerWidth * 0.5 : window.innerWidth - 32;
    const targetH = isSmUp ? window.innerHeight * 0.5 : window.innerHeight - 32;

    const scale = Math.max(
      0.18,
      Math.min(0.85, Math.min(rect.width / targetW, rect.height / targetH)),
    );

    setOrigin({
      x: rectCenterX - viewportCenterX,
      y: rectCenterY - viewportCenterY,
      scale,
      radius: 18,
    });
    setIsOpen(true);
  };

  const handleOpenAppFromNotification = (
    e: React.MouseEvent<HTMLElement>,
    n: PhoneNotification,
  ) => {
    // Pause notifications while "opening the app".
    setIsPaused(true);

    const containerRect = screenRef.current?.getBoundingClientRect();
    const rect = e.currentTarget.getBoundingClientRect();
    const targetW = containerRect?.width ?? rect.width;
    const targetH = containerRect?.height ?? rect.height;

    const rectCenterX = rect.left + rect.width / 2;
    const rectCenterY = rect.top + rect.height / 2;
    const containerCenterX =
      (containerRect?.left ?? 0) + (containerRect?.width ?? targetW) / 2;
    const containerCenterY =
      (containerRect?.top ?? 0) + (containerRect?.height ?? targetH) / 2;

    const scale = Math.max(
      0.18,
      Math.min(0.95, Math.min(rect.width / targetW, rect.height / targetH)),
    );

    setAppOrigin({
      x: rectCenterX - containerCenterX,
      y: rectCenterY - containerCenterY,
      scale,
      radius: 22,
    });

    // Basic routing based on the notification.
    if (n.id === "best-time") {
      setAppRoute({ kind: "insight", insightId: "best-time" });
    } else if (n.id === "plan-violation") {
      setAppRoute({ kind: "tab", tab: "home" });
    } else if (n.id === "sync") {
      setAppRoute({ kind: "tab", tab: "settings" });
    } else if (n.id === "discord") {
      setAppRoute({ kind: "tab", tab: "signals" });
    } else if (n.id === "backtest") {
      setAppRoute({ kind: "tab", tab: "journal" });
    } else if (n.id === "risk") {
      setAppRoute({ kind: "tab", tab: "home" });
    } else if (n.id === "webhook") {
      setAppRoute({ kind: "tab", tab: "settings" });
    } else {
      setAppRoute({ kind: "tab", tab: "home" });
    }

    setScene("app");
  };

  const handleCloseApp = () => {
    setScene("lock");
    // Resume shortly after returning to lockscreen.
    window.setTimeout(() => setIsPaused(false), 500);
  };

  useEffect(() => {
    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }

    if (isOpen) {
      setIsPaused(true);
      return;
    }

    // Resume 1.5s after closing.
    setIsPaused(true);
    resumeTimeoutRef.current = window.setTimeout(() => {
      setIsPaused(false);
    }, 1500);
  }, [isOpen]);

  return (
    <>
      <IphoneMock>
        <div ref={screenRef} className="relative flex h-full w-full flex-col">
          {/* Lockscreen */}
          <motion.div
            className="relative z-10"
            animate={scene === "lock" ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* iOS-ish status + lockscreen header */}
            <div className="flex items-center justify-between px-1 text-[11px] font-medium text-white/80">
              <div>{timeText}</div>
              <div className="flex items-center gap-1.5 text-white/70">
                <div className="h-2 w-3 rounded-sm border border-white/30" />
                <div className="h-2 w-2 rounded-full bg-white/70" />
                <div className="h-2 w-4 rounded-sm bg-white/70" />
              </div>
            </div>

            <div className="mt-6 mb-4 text-center">
              <div className="text-[12px] text-white/60">{dateText}</div>
              <div className="mt-1 text-5xl font-semibold tracking-tight text-white">
                {timeText}
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between px-1 text-[11px] text-white/60">
              <div className="font-medium">Notifications</div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500/70 shadow-[0_0_10px_rgba(249,115,22,0.45)]" />
                <span className="font-medium text-white/70">Live</span>
              </div>
            </div>

            <AnimatedList
              // Slow down the pace a bit
              delay={1800}
              holdDelay={1800}
              loop
              paused={isPaused || scene !== "lock"}
              variant="iosPush"
              stackAfter={3}
              itemHeightPx={92}
              itemGapPx={8}
              stackOverlapPx={12}
              stackScaleStep={0.02}
              stackOpacityStep={0.12}
              maxStackDepth={2}
              itemMotionProps={{
                transition: { duration: 0.75, ease: "easeOut" },
              }}
              className="w-full"
            >
              {notifications.map((n) => (
                <NotificationTile
                  key={n.id}
                  notification={n}
                  onOpenAppAction={handleOpenAppFromNotification}
                  onOpenInfoAction={handleNotificationInfoClick}
                />
              ))}
            </AnimatedList>
          </motion.div>

          {/* App scene */}
          <motion.div
            className="absolute inset-0 z-20"
            style={{ pointerEvents: scene === "app" ? "auto" : "none" }}
            initial={false}
            animate={scene === "app" ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 overflow-hidden rounded-3xl"
              initial={{
                opacity: 0,
                scale: appOrigin.scale,
                x: appOrigin.x,
                y: appOrigin.y,
                borderRadius: appOrigin.radius,
              }}
              animate={
                scene === "app"
                  ? {
                      opacity: 1,
                      scale: 1,
                      x: 0,
                      y: 0,
                      borderRadius: 24,
                    }
                  : {
                      opacity: 0,
                      scale: appOrigin.scale,
                      x: appOrigin.x,
                      y: appOrigin.y,
                      borderRadius: appOrigin.radius,
                    }
              }
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <div className="absolute top-3 left-3 z-30">
                <button
                  type="button"
                  onClick={handleCloseApp}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden"
                >
                  <span className="text-white/70">←</span> Lock screen
                </button>
              </div>
              <TraderLaunchpadMobileMock
                route={appRoute}
                onNavigateAction={setAppRoute}
              />
            </motion.div>
          </motion.div>
        </div>
      </IphoneMock>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          // Disable the default zoom/fade so our motion feels like it “pops” from the click.
          asChild
          showCloseButton={false}
          className="h-[calc(100vh-2rem)] max-h-none w-[calc(100vw-2rem)] max-w-none duration-0 data-[state=closed]:animate-none data-[state=open]:animate-none sm:h-[50vh] sm:w-[50vw]"
        >
          <motion.div
            className="overflow-auto rounded-lg border border-white/10 bg-black/60 p-6 text-white shadow-lg backdrop-blur-xl"
            initial={{
              opacity: 0,
              scale: origin.scale,
              x: origin.x,
              y: origin.y,
              borderRadius: origin.radius,
            }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0, borderRadius: 12 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <DialogClose className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-orange-400/50 focus:outline-hidden">
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>

            <DialogHeader>
              <DialogTitle className="text-white">
                {selected?.details.title ?? "Notification"}
              </DialogTitle>
              <DialogDescription className="text-white/70">
                {selected?.details.summary ?? ""}
              </DialogDescription>
            </DialogHeader>

            {selected?.details.howCalculated ? (
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">
                  How this was calculated
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  {selected.details.howCalculated}
                </p>
              </div>
            ) : null}
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
};
