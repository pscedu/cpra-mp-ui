import { useAtomValue, useSetAtom } from "jotai";
import {
  catalogQueriesAtom,
  setSelectedFilterChoicesAtom,
  structureAtom,
} from "../helpers/state";

import SidebarSelect from "@/components/sidebar-select";
import {
  ArrowsUpFromLine,
  Blocks,
  Bubbles,
  Building,
  Calculator,
  CalendarSync,
  CloudLightning,
  CloudSun,
  FolderInput,
  House,
  Leaf,
  Percent,
  PersonStanding,
  Route,
  Snail,
  SoapDispenserDroplet,
  Sprout,
  Trees,
  Truck,
  Users,
  WindArrowDown,
} from "lucide-react";

const dimensionIcons = {
  model_group_id: FolderInput,
  scenario_id: CloudSun,
  aggregate_type: Calculator,
  aep: CalendarSync,
  storm_id: CloudLightning,
  pumping_id: SoapDispenserDroplet,
  fragility_scenario: ArrowsUpFromLine,
  population_variant: Users,
  clara_variant: Bubbles,
  asset_type: House,
  infrastructure_category: Building,
  exposure_type: WindArrowDown,
  ns_project_id: Blocks,
  participation_rate: PersonStanding,
  migration: Truck,
  ssp: Route,
  habitat_code: Snail,
  vegetation_coverage_type: Sprout,
  veg_species_code: Leaf,
  ffibs_type: Trees,
  percentile: Percent,
};

export default function DimensionsSelect() {
  const structure = useAtomValue(structureAtom);
  const catalogQueries = useAtomValue(catalogQueriesAtom);
  const setSelectedFilterChoices = useSetAtom(setSelectedFilterChoicesAtom);

  if (!structure || !catalogQueries) return;
  const cqs = catalogQueries;

  return cqs.activeDimensions
    .filter((dim) => dim.filterType === "select")
    .map((dimension) => {
      let options;
      if (dimension.values) {
        options = dimension.values
          .filter((dv) =>
            cqs.combinedChoices[dimension.name].includes(dv.value),
          )
          .map((dv) => ({
            label: dv.label || dv.value.toString(),
            value: dv.value,
          }));
      } else {
        options = cqs.combinedChoices[dimension.name].map((value) => ({
          label: value.toString(),
          value,
        }));
      }
      return (
        <SidebarSelect
          icon={dimensionIcons[dimension.name]}
          id={dimension.name}
          label={dimension.label}
          key={dimension.name}
          value={cqs.combinedFilters[dimension.name]}
          onChange={(value) =>
            setSelectedFilterChoices({
              dimensionName: dimension.name,
              values: value,
            })
          }
          options={options}
          supportsSubtract={true}
        />
      );
    });
}
