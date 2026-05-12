import { useAtom, useAtomValue } from "jotai";
import { ReactNode } from "react";
import {
  catalogQueriesAtom,
  endDateAtom,
  startDateAtom,
  selectedGeographiesAtom,
  analysisAtom,
  visualizationTypeAtom,
} from "@/helpers/state";
import { useTheme } from "@/components/theme-provider";

import BaseChart from "@/components/base-chart";

export default function Chart({
  actions = false,
  children = null,
  padding = 16,
}: {
  actions?: boolean;
  children?: ReactNode;
  padding?: number;
}) {
  const mapCatalogQuery = useAtomValue(catalogQueriesAtom).getMapCatalogQuery();
  const analysis = useAtomValue(analysisAtom);
  const selectedGeographies = useAtomValue(selectedGeographiesAtom);
  const visualizationType = useAtomValue(visualizationTypeAtom);

  const [startDate, setStartDate] = useAtom(startDateAtom);
  const [endDate, setEndDate] = useAtom(endDateAtom);

  const theme = useTheme();

  const visualizationSpecUrl = mapCatalogQuery.getVisualizationUrl({
    analysis,
    selectedGeographies,
    visualizationType,
  });

  return visualizationSpecUrl ? (
    <BaseChart
      actions={actions}
      className="rounded-xl bg-sidebar"
      endDate={endDate}
      setEndDate={setEndDate}
      setStartDate={setStartDate}
      spec={visualizationSpecUrl}
      startDate={startDate}
      padding={padding}
      theme={theme.theme}
    >
      {children}
    </BaseChart>
  ) : null;
}
