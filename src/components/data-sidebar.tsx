import { usePortalState } from "../helpers/state";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import DatasetSelect from "@/components/dataset-select";
import DimensionsSelect from "@/components/dimensions-select";

export default function DataSidebar() {
  const { catalogQueries, datasets, structure } = usePortalState();

  if (!structure.value || !datasets.value?.length || !catalogQueries.value)
    return;

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
