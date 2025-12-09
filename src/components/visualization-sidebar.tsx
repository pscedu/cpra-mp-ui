import { useAtomValue } from "jotai";
import { mapCatalogQueryAtom, structureAtom } from "@/helpers/state";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import VisualizationSelect from "./visualization-select";
import MapSelect from "./map-select";

export default function VisualizationSidebar() {
  const structure = useAtomValue(structureAtom);
  const mapCatalogQuery = useAtomValue(mapCatalogQueryAtom);

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
