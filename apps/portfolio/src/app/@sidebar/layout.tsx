import { headers } from "next/headers";

import { TeamSwitcher } from "@acme/ui/general/team-switcher";
import { Sidebar, SidebarContent, SidebarHeader } from "@acme/ui/sidebar";

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
