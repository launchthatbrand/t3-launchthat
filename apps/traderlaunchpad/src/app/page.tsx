import Link from "next/link";

import { Header } from "../components/landing/Header";
import { Hero } from "../components/landing/Hero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Pricing } from "../components/landing/Pricing";
import { SocialProof } from "../components/landing/SocialProof";

export default function HomePage() {
  return (
    <div className="text-foreground min-h-screen bg-black selection:bg-blue-500/30">
      <Header />

      <main>
        <Hero />
        <HowItWorks />
        <SocialProof />
        <Pricing />
      </main>

      <footer className="border-t border-white/10 bg-black py-12 text-center">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex items-center justify-center gap-2 text-xl font-bold text-white">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-xs">
              TL
            </div>
            TraderLaunchpad
          </div>
          <div className="mb-8 flex justify-center gap-6 text-sm text-gray-500">
            <Link href="#" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              Support
            </Link>
          </div>
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} TraderLaunchpad. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
