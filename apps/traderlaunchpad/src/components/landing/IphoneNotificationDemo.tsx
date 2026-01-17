"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { XIcon } from "lucide-react";
import { motion } from "motion/react";

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

import {
  NotificationTile,
  type PhoneNotification,
} from "./NotificationTile";

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

  const notifications = useMemo<Array<PhoneNotification>>(
    () => [
      {
        id: "best-time",
        app: "TraderLaunchpad",
        time: "now",
        title: "Best time to trade in 10 minutes",
        body: "Volatility window opening • Setup aligns with your edge",
        accent: true,
        details: {
          title: "Best time to trade in 10 minutes",
          summary:
            "We detected a high-probability window based on your preferred session, recent volatility, and historical performance for this setup.",
          howCalculated:
            "This alert blends: (1) session timing (your configured market hours), (2) recent volatility expansion vs. baseline, (3) trend + momentum alignment, and (4) your strategy’s historical win-rate at similar market conditions. The '10 minutes' estimate comes from the average time-to-breakout after a comparable compression pattern.",
        },
      },
      {
        id: "sync",
        app: "TradeLocker",
        time: "1m",
        title: "Sync complete",
        body: "Orders matched • Positions reconciled",
        details: {
          title: "TradeLocker sync complete",
          summary:
            "Your account snapshot and open positions were successfully synchronized.",
        },
      },
      {
        id: "discord",
        app: "Discord",
        time: "2m",
        title: "Alert sent",
        body: "Posted to #signals • 2.1k viewers reached",
        details: {
          title: "Discord alert sent",
          summary:
            "A formatted signal notification was delivered to your configured Discord channel.",
        },
      },
      {
        id: "backtest",
        app: "Backtester",
        time: "3m",
        title: "Report ready",
        body: "Win rate + expectancy calculated • Export available",
        details: {
          title: "Backtest report ready",
          summary:
            "We finished running the strategy across your selected time range and compiled a summary report.",
        },
      },
      {
        id: "risk",
        app: "Risk Engine",
        time: "now",
        title: "Guard active",
        body: "Drawdown protected • Exposure within limits",
        accent: true,
        details: {
          title: "Risk guard active",
          summary:
            "Your risk rules are currently enforcing exposure limits and drawdown protection.",
        },
      },
      {
        id: "webhook",
        app: "Webhooks",
        time: "4m",
        title: "Delivered",
        body: "Latency 184ms • Subscriber acknowledged",
        details: {
          title: "Webhook delivered",
          summary:
            "The outbound webhook was delivered successfully and acknowledged by the subscriber endpoint.",
        },
      },
    ],
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

  const handleNotificationClick = (
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
          paused={isPaused}
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
              onClickAction={handleNotificationClick}
            />
          ))}
        </AnimatedList>
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
