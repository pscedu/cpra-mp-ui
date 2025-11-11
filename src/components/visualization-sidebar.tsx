import { usePortalState } from "@/helpers/state";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import VisualizationSelect from "./visualization-select";
import MapSelect from "./map-select";

export default function VisualizationSidebar() {
  const { mapCatalogQuery, structure } = usePortalState();

  if (!structure.value || !mapCatalogQuery.value) return;

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
