"use client";

import * as React from "react";

import {
  AndroidIcon,
  AppleLogo,
  Dialog,
  DialogContent,
  ShineBorder,
} from "@acme/ui";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  InstallHowTo,
  useAddToHomeScreen,
} from "launchthat-plugin-pwa/frontend";

interface HeroCtaInstallBlockProps {
  primaryCtaHref: string;
  primaryCtaLabel: string;
}

export function HeroCtaInstallBlock({
  primaryCtaHref,
  primaryCtaLabel,
}: HeroCtaInstallBlockProps) {
  const { isIOS, isStandalone, canPromptInstall, promptInstall } =
    useAddToHomeScreen();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);

  const shouldShowDialog = isIOS || !canPromptInstall;

  const handleInstallClick = async () => {
    if (isInstalling) return;
    if (isStandalone) return;
    if (shouldShowDialog) {
      setDialogOpen(true);
      return;
    }

    setIsInstalling(true);
    try {
      await promptInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="mt-12 mb-6 flex flex-col items-center justify-center gap-3">
      <Link href={primaryCtaHref} className="inline-block">
        <span className="relative inline-flex h-14 min-w-[200px] items-center justify-center rounded-[1.75rem] border border-neutral-200 bg-white text-lg font-bold text-black transition-transform hover:scale-105 dark:border-slate-800">
          <ShineBorder
            borderWidth={3}
            duration={20}
            shineColor={["#f97316", "#fb923c", "#f97316"]}
            className="rounded-[inherit]"
          />
          <span className="relative z-10 flex w-full items-center justify-between gap-4 px-2">
            <span className="w-full">{primaryCtaLabel}</span>
            <span className="flex min-h-8 min-w-8 items-center justify-center rounded-full bg-black text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </span>
        </span>
      </Link>

      {isStandalone ? null : (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <div className="mb-12 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
            <button
              type="button"
              onClick={() => void handleInstallClick()}
              disabled={isInstalling}
              className="inline-flex w-48 items-center gap-2 rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-2 text-foreground/80 backdrop-blur-sm transition hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AppleLogo size={30} color="currentColor" />
              <div className="flex w-full flex-col items-center justify-center">
                <span className="text-[10px] font-medium tracking-[0.2em] text-foreground/50">
                  AVAILABLE ON
                </span>
                <span className="text-md font-semibold">iOS</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => void handleInstallClick()}
              disabled={isInstalling}
              className="inline-flex w-48 items-center gap-2 rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-2 text-foreground/80 backdrop-blur-sm transition hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AndroidIcon size={32} color="currentColor" />
              <div className="flex w-full flex-col items-center justify-center">
                <span className="text-[10px] font-medium tracking-[0.2em] text-foreground/50">
                  GET IT ON
                </span>
                <span className="text-md font-semibold">Android</span>
              </div>
            </button>
          </div>

          {shouldShowDialog ? (
            <DialogContent className="max-w-md">
              <InstallHowTo
                appName="Trader Launchpad"
                isIOS={isIOS}
                canPromptInstall={canPromptInstall}
              />
            </DialogContent>
          ) : null}
        </Dialog>
      )}
    </div>
  );
}
