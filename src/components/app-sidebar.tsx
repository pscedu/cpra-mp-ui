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
import IssueDetail from "./issue-detail";
import Issues from "./issues";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { activity, issue } = usePortalState();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ActivitySwitcher />
      </SidebarHeader>
      <SidebarContent>
        {activity.value === "data" && <Dimensions />}
        {activity.value === "issues" && (
          <> {issue.value ? <IssueDetail /> : <Issues />}</>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
