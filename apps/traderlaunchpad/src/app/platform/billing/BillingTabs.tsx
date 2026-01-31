 "use client";
 
 import Link from "next/link";
 import { usePathname } from "next/navigation";
 import { cn } from "~/lib/utils";
 
 const tabs: Array<{ href: string; label: string }> = [
   { href: "/platform/billing", label: "Overview" },
   { href: "/platform/billing/orders", label: "Orders" },
   { href: "/platform/billing/products", label: "Products" },
   { href: "/platform/billing/coupons", label: "Coupons" },
 ];
 
 export const BillingTabs = () => {
   const pathname = usePathname();
 
   return (
     <div className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
       {tabs.map((tab) => {
         const isActive = pathname === tab.href;
         return (
           <Link
             key={tab.href}
             href={tab.href}
             aria-current={isActive ? "page" : undefined}
             className={cn(
               "text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
               isActive &&
                 "bg-background dark:text-foreground dark:border-input dark:bg-input/30 shadow-sm",
             )}
           >
             {tab.label}
           </Link>
         );
       })}
     </div>
   );
 };
