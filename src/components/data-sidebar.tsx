import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import DatasetSelect from "@/components/dataset-select";
import DimensionsSelect from "@/components/dimensions-select";

export default function DataSidebar() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Select data</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <DatasetSelect />
          <DimensionsSelect />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
