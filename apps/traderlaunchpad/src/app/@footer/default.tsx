export default function DefaultFooter() {
  return (
    <footer className="mt-10 border-t border-white/10 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto flex flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/tl-logo-1.png" alt="Trader Launchpad" className="h-10 w-10" />
          <div>
            <div className="bg-linear-to-b from-white from-40% via-orange-200 via-60% to-orange-500 bg-clip-text text-base font-bold tracking-tight text-transparent">
              Trader Launchpad
            </div>
            <div className="text-xs text-white/50">
              Mission control for trading groups.
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/70">
          <a href="/#features" className="hover:text-white">
            Features
          </a>
          <a href="/brokers" className="hover:text-white">
            Brokers
          </a>
          <a href="/firms" className="hover:text-white">
            Prop Firms
          </a>
          <a href="/leaderboards" className="hover:text-white">
            Leaderboards
          </a>
          <a href="/#blog" className="hover:text-white">
            Blog
          </a>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-4 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} Trader Launchpad. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href="/terms" className="hover:text-white">
              Terms
            </a>
            <a href="/privacy" className="hover:text-white">
              Privacy
            </a>
            <a href="/support" className="hover:text-white">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

