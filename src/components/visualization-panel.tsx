import { useAtom, useAtomValue } from "jotai";
import {
  catalogQueriesAtom,
  endDateAtom,
  startDateAtom,
  selectedGeographiesAtom,
  analysisAtom,
  visualizationTypeAtom,
} from "@/helpers/state";
import { ResizableHandle, ResizablePanel } from "./ui/resizable";
import VisualizationChart from "./visualization-chart";

export default function VisualizationPanel() {
  const mapCatalogQuery = useAtomValue(catalogQueriesAtom).getMapCatalogQuery();
  const analysis = useAtomValue(analysisAtom);
  const selectedGeographies = useAtomValue(selectedGeographiesAtom);
  const visualizationType = useAtomValue(visualizationTypeAtom);

  const [startDate, setStartDate] = useAtom(startDateAtom);
  const [endDate, setEndDate] = useAtom(endDateAtom);

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
            <VisualizationChart
              endDate={endDate}
              setEndDate={setEndDate}
              setStartDate={setStartDate}
              spec={visualizationSpecUrl}
              startDate={startDate}
            />
          </ResizablePanel>
        </>
      ) : null}
    </>
  );
}
