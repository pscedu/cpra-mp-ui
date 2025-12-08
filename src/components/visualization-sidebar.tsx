import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import VisualizationSelect from "./visualization-select";
import MapSelect from "./map-select";

export default function VisualizationSidebar() {
  // Atoms imported at top

  if (!structure || !mapCatalogQuery) return;

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Select visualization</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem className="px-1">
            <MapSelect />
          </SidebarMenuItem>
          <SidebarMenuItem className="px-1">
            <VisualizationSelect />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
