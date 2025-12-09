import { useAtomValue, useSetAtom, useAtom } from "jotai";
import {
  catalogQueriesAtom,
  datasetsAtom,
  structureAtom,
} from "@/helpers/state";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import DatasetSelect from "@/components/dataset-select";
import DimensionsSelect from "@/components/dimensions-select";

export default function DataSidebar() {
  const structure = useAtomValue(structureAtom);
  const datasets = useAtomValue(datasetsAtom);
  const catalogQueries = useAtomValue(catalogQueriesAtom);

  if (!structure || !datasets?.length || !catalogQueries) return;

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
