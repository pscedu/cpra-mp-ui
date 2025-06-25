import { usePortalState } from "../helpers/state";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export default function Dimensions() {
  const {
    catalogQueries,
    datasets,
    setSelectedDatasets,
    setSelectedFilterChoices,
    structure,
  } = usePortalState();

  if (!structure.value || !datasets.value?.length || !catalogQueries.value)
    return;
  const cqs = catalogQueries.value;

  const datasetItems = structure.value.datasets.map((dataset) => (
    <SelectItem
      key={[dataset.variable.name, dataset.grid.name, dataset.time_unit].join(
        "|",
      )}
      value={dataset}
    >
      {dataset.variable.label}: {dataset.time_unit}
    </SelectItem>
  ));

  const dimensionSelects = cqs.activeDimensions
    .filter((dim) => dim.filterType === "select")
    .map((dimension) => {
      let items;
      if (dimension.values) {
        items = dimension.values
          .filter((dv) =>
            cqs.combinedChoices[dimension.name].includes(dv.value),
          )
          .map((dv) => (
            <SelectItem key={dv.value} value={dv.value}>
              {dv.label || dv.value.toString()}
            </SelectItem>
          ));
      } else {
        items = cqs.combinedChoices[dimension.name].map((value) => (
          <SelectItem key={value} value={value}>
            {value.toString()}
          </SelectItem>
        ));
      }
      return (
        <Select
          key={dimension.name}
          value={cqs.combinedFilters[dimension.name][0]}
          onValueChange={(value) =>
            setSelectedFilterChoices(dimension.name, [value])
          }
        >
          <SelectTrigger className="mx-2 my-2 max-w-72">
            <SelectValue placeholder={`Select ${dimension.label}`} />
          </SelectTrigger>
          <SelectContent>{items}</SelectContent>
        </Select>
      );
    });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Select data</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <Select
            value={datasets.value[0]}
            onValueChange={(dataset) => setSelectedDatasets([dataset])}
          >
            <SelectTrigger className="mx-2 mb-2 max-w-72">
              <SelectValue placeholder="Select a dataset" />
            </SelectTrigger>
            <SelectContent>{datasetItems}</SelectContent>
          </Select>
          {dimensionSelects}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
