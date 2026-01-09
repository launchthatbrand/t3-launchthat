import React from "react";
import Link from "next/link";
import { HomeIcon } from "lucide-react";

import { Button } from "@acme/ui/button";

export default function FooterLayout() {
  return (
    <div className="bg-sidebar flex h-20 items-center border-t p-6">
      <div className="container flex items-center gap-2">
        <Button variant="outline">
          <Link href="/">
            <HomeIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
