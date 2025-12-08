import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import DatasetSelect from "@/components/dataset-select";
import DimensionsSelect from "@/components/dimensions-select";

export default function DataSidebar() {
  // Atoms imported at top

  if (!structure || !datasets?.length || !catalogQueries)
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
