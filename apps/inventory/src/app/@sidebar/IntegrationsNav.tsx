import Link from "next/link";
import {
  ArrowLeftRight,
  Boxes,
  Cable,
  Code,
  Cog,
  Compass,
  Zap,
} from "lucide-react";

export default function IntegrationsNav() {
  return (
    <div className="space-y-1">
      <Link
        href="/integrations"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        <Compass className="h-4 w-4" />
        <span>Overview</span>
      </Link>

      <Link
        href="/integrations/connections"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        <Cable className="h-4 w-4" />
        <span>Connections</span>
      </Link>

      <Link
        href="/integrations/scenarios"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        <Zap className="h-4 w-4" />
        <span>Scenarios</span>
      </Link>

      <Link
        href="/integrations/transformations"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        <ArrowLeftRight className="h-4 w-4" />
        <span>Transformations</span>
      </Link>

      <Link
        href="/integrations/apps"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        <Boxes className="h-4 w-4" />
        <span>App Directory</span>
      </Link>

      <Link
        href="/integrations/settings"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        <Cog className="h-4 w-4" />
        <span>Settings</span>
      </Link>

      <Link
        href="/integrations/developer"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        <Code className="h-4 w-4" />
        <span>Developer</span>
      </Link>
    </div>
  );
}
