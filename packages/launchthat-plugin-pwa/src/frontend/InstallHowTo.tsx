"use client";

import * as React from "react";
import { DialogDescription, DialogHeader, DialogTitle } from "@acme/ui";

type InstallHowToProps = {
  appName?: string;
  isIOS: boolean;
  canPromptInstall: boolean;
};

const stepBase =
  "install-step flex items-start gap-3 rounded-xl border border-border/60 bg-background/70 p-3 text-sm text-foreground transition";

const StepIcon = ({
  children,
  highlight = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) => (
  <div
    className={`install-icon relative flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background text-foreground/80 ${
      highlight ? "install-icon--active" : ""
    }`}
  >
    <span className="relative z-10">{children}</span>
  </div>
);

const ShareIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 16V4" />
    <path d="M8 8l4-4 4 4" />
    <path d="M5 20h14a2 2 0 0 0 2-2v-4" />
    <path d="M3 14v4a2 2 0 0 0 2 2" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

const HomeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
);

export function InstallHowTo({
  appName = "Trader Launchpad",
  isIOS,
  canPromptInstall,
}: InstallHowToProps) {
  const steps = isIOS
    ? [
        {
          title: "Tap the ••• menu",
          description: "Use the bottom-right menu in your browser",
          icon: <MenuIcon />,
          highlight: true,
        },
        {
          title: "Tap Share",
          description: "Open the share sheet",
          icon: <ShareIcon />,
        },
        {
          title: "Tap ••• More",
          description: "Find the “More” menu in the share sheet",
          icon: <MenuIcon />,
        },
        {
          title: "Add to Home Screen",
          description: `Select “Add to Home Screen” for ${appName}`,
          icon: <HomeIcon />,
        },
      ]
    : canPromptInstall
      ? [
          {
            title: "Tap Install",
            description: `Install ${appName} when the prompt appears`,
            icon: <HomeIcon />,
            highlight: true,
          },
          {
            title: "Confirm install",
            description: "Confirm the install prompt",
            icon: <PlusIcon />,
          },
        ]
      : [
          {
            title: "Open browser menu",
            description: "Tap the menu button in your browser",
            icon: <MenuIcon />,
            highlight: true,
          },
          {
            title: "Tap Install app",
            description: "Look for “Install app” or “Add to Home Screen”",
            icon: <PlusIcon />,
          },
          {
            title: "Confirm install",
            description: "Confirm the install prompt",
            icon: <HomeIcon />,
          },
        ];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Install {appName}</DialogTitle>
        <DialogDescription>
          Follow these quick steps to add the app to your home screen.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 grid gap-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className={stepBase}
            style={{
              animationDelay: `${index * 0.6}s`,
            }}
          >
            <StepIcon highlight={step.highlight}>{step.icon}</StepIcon>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-foreground">
                {step.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .install-step {
          animation: installPulse 3.6s ease-in-out infinite;
        }

        .install-icon {
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }

        .install-icon--active {
          box-shadow:
            0 0 0 6px rgba(249, 115, 22, 0.18),
            0 12px 28px rgba(249, 115, 22, 0.2);
          transform: translateY(-1px) scale(1.03);
        }

        @keyframes installPulse {
          0%,
          100% {
            border-color: rgba(148, 163, 184, 0.4);
            box-shadow: 0 0 0 rgba(249, 115, 22, 0);
          }
          35% {
            border-color: rgba(249, 115, 22, 0.55);
            box-shadow: 0 10px 28px rgba(249, 115, 22, 0.18);
          }
          60% {
            border-color: rgba(148, 163, 184, 0.45);
            box-shadow: 0 0 0 rgba(249, 115, 22, 0);
          }
        }
      `}</style>
    </>
  );
}
