import { AppSidebar } from "@/components/app-sidebar";
import MapDataLoading from "@/components/map-data-loading";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import MapOptionsMenu from "./map-options-menu";
import TimeSelect from "./time-select";
import { ResizablePanel, ResizablePanelGroup } from "./ui/resizable";

import { ErrorBoundary } from "react-error-boundary";
import VisualizationPanel from "./visualization-panel";
import { Suspense } from "react";
import Map from "@/components/map";

export default function MapPage() {
  return (
    <SidebarProvider>
      <Suspense>
        <AppSidebar />
      </Suspense>
      <SidebarInset>
        <header className="flex w-full h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center gap-2 px-4">
            <ErrorBoundary fallback={<></>}>
              <Suspense>
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <MapDataLoading />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <TimeSelect />
                <MapOptionsMenu />
              </Suspense>
            </ErrorBoundary>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel>
              <ErrorBoundary fallback={<></>}>
                <Suspense>
                  <Map />
                </Suspense>
              </ErrorBoundary>
            </ResizablePanel>
            <ErrorBoundary fallback={<></>}>
              <Suspense>
                <VisualizationPanel />
              </Suspense>
            </ErrorBoundary>
          </ResizablePanelGroup>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
