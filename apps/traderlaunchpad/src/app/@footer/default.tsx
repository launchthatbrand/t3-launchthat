export default function DefaultFooter() {
  return (
    <footer className="mt-10 border-t border-border/40 bg-background/50 backdrop-blur-md">
      <div className="container mx-auto flex flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/tl-logo-1.png" alt="Trader Launchpad" className="h-10 w-10" />
          <div>
            <div className="text-base font-bold tracking-tight text-foreground dark:bg-linear-to-b dark:from-white dark:from-40% dark:via-orange-200 dark:via-60% dark:to-orange-500 dark:bg-clip-text dark:text-transparent">
              Trader Launchpad
            </div>
            <div className="text-xs text-muted-foreground">
              Mission control for trading groups.
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <a href="/#features" className="hover:text-foreground">
            Features
          </a>
          <a href="/brokers" className="hover:text-foreground">
            Brokers
          </a>
          <a href="/firms" className="hover:text-foreground">
            Prop Firms
          </a>
          <a href="/leaderboards" className="hover:text-foreground">
            Leaderboards
          </a>
          <a href="/#blog" className="hover:text-foreground">
            Blog
          </a>
        </nav>
      </div>

      <div className="border-t border-border/40">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} Trader Launchpad. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href="/terms" className="hover:text-foreground">
              Terms
            </a>
            <a href="/privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="/support" className="hover:text-foreground">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

