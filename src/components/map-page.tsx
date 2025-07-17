import { usePortalState } from "@/helpers/state";

import { AppSidebar } from "@/components/app-sidebar";
import MapDataLoading from "@/components/map-data-loading";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Map from "./map";
import MapOptionsMenu from "./map-options-menu";
import TimeSelect from "./time-select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import Visualization from "./visualization";

export default function MapPage() {
  const { visualizationSpec } = usePortalState();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex w-full h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <MapDataLoading />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <TimeSelect />
            <MapOptionsMenu />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel>
              <Map />
            </ResizablePanel>
            {visualizationSpec.value ? (
              <>
                <ResizableHandle className="h-16" />
                <ResizablePanel>
                  <Visualization spec={visualizationSpec.value} />
                </ResizablePanel>
              </>
            ) : null}
          </ResizablePanelGroup>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
