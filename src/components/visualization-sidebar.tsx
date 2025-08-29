import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import VisualizationSelect from "./visualization-select";

export default function VisualizationSidebar() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Select visualization</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem className="px-1">
          <VisualizationSelect />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
