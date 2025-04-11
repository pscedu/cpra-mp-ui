import * as React from "react";
import { usePortalState } from "@/helpers/state";

import { NavUser } from "@/components/nav-user";
import { ActivitySwitcher } from "@/components/activity-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import Dimensions from "./dimensions";
import Issues from "./issues";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { activity } = usePortalState();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ActivitySwitcher />
      </SidebarHeader>
      <SidebarContent>
        {activity.value === "data" && <Dimensions />}
        {activity.value === "issues" && <Issues />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
