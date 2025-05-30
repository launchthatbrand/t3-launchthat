import { headers } from "next/headers";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@acme/ui/components/sidebar";
import { TeamSwitcher } from "@acme/ui/general/team-switcher";

// function isMondayFrame() {
//   const headersList = headers();
//   const referer = headersList.get("referer") ?? "";
//   return referer.includes("monday.com");
// }

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // if (isMondayFrame()) {
  //   return null;
  // }

  return (
    // <Sidebar>
    <>
      {/* <Sidebar> */}
      {/* <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader> */}
      <SidebarContent>{children}</SidebarContent>
    </>
    // </Sidebar>
  );
}
