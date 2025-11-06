import * as React from "react";
import { useAtomValue } from "jotai";
import { activityAtom, issueAtom } from "@/helpers/state";

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
  const activity = useAtomValue(activityAtom);
  const issue = useAtomValue(issueAtom);
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ActivitySwitcher />
      </SidebarHeader>
      <SidebarContent>
        {open && (
          <>
            {activity === "data" && (
              <>
                <DataSidebar />
                <VisualizationSidebar />
              </>
            )}
            {activity === "issues" && (
              <>
                {issue ? (
                  issue === "new" ? (
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
