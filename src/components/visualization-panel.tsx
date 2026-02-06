import { useAtom, useAtomValue } from "jotai";
import {
  catalogQueriesAtom,
  endDateAtom,
  startDateAtom,
  selectedGeographiesAtom,
  analysisAtom,
  visualizationTypeAtom,
} from "@/helpers/state";
import { useTheme } from "@/components/theme-provider";

import { ResizableHandle, ResizablePanel } from "./ui/resizable";
import { LoaderCircle } from "lucide-react";
import Chart from "./visualization/chart";

export default function VisualizationPanel({
  actions = false,
  padding = 16,
}: {
  actions?: boolean;
  padding?: number;
}) {
  const mapCatalogQuery = useAtomValue(catalogQueriesAtom).getMapCatalogQuery();
  const analysis = useAtomValue(analysisAtom);
  const selectedGeographies = useAtomValue(selectedGeographiesAtom);
  const visualizationType = useAtomValue(visualizationTypeAtom);

  const [startDate, setStartDate] = useAtom(startDateAtom);
  const [endDate, setEndDate] = useAtom(endDateAtom);

  const theme = useTheme();

  const visualizationSpecUrl = mapCatalogQuery.getVisulizationUrl({
    analysis,
    selectedGeographies,
    visualizationType,
  });

  return (
    <>
      {visualizationSpecUrl ? (
        <>
          <ResizableHandle className="h-16" />
          <ResizablePanel>
            <Chart
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
              <LoaderCircle className="animate-spin absolute" />
            </Chart>
          </ResizablePanel>
        </>
      ) : null}
    </>
  );
}
