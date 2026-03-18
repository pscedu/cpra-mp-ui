import * as React from "react";
import { Suspense } from "react";
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
import { LoaderCircle } from "lucide-react";
import DownloadSidebar from "./download-sidebar";

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
              <Suspense
                fallback={<LoaderCircle className="animate-spin m-2" />}
              >
                {issue ? (
                  issue === "new" ? (
                    <IssueForm />
                  ) : (
                    <IssueDetail />
                  )
                ) : (
                  <Issues />
                )}
              </Suspense>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <DownloadSidebar />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
