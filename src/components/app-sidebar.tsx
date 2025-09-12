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
  useSidebar,
} from "@/components/ui/sidebar";

import DataSidebar from "@/components/data-sidebar";
import IssueDetail from "./issue-detail";
import IssueForm from "./issue-form";
import Issues from "./issues";
import VisualizationSidebar from "./visualization-sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { activity, issue } = usePortalState();
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ActivitySwitcher />
      </SidebarHeader>
      <SidebarContent>
        {open && (
          <>
            {activity.value === "data" && (
              <>
                <DataSidebar />
                <VisualizationSidebar />
              </>
            )}
            {activity.value === "issues" && (
              <>
                {issue.value ? (
                  issue.value === "new" ? (
                    <IssueForm />
                  ) : (
                    <IssueDetail />
                  )
                ) : (
                  <Issues />
                )}
              </>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
