import { Search, User } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

const Header = () => {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tracking-tight text-primary">
          MonClone
        </span>
      </div>
      <div className="flex flex-1 justify-center">
        {/* Placeholder for global search */}
        <div className="relative w-full max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <Input placeholder="Search..." className="pl-9" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Placeholder for user profile/settings */}
        <Button variant="ghost" size="icon" aria-label="User Profile">
          <User />
        </Button>
      </div>
    </header>
  );
};

export default Header;
