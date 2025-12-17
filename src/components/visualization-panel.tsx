import { useAtomValue } from "jotai";
import {
  catalogQueriesAtom,
  selectedGeographiesAtom,
  analysisAtom,
  visualizationTypeAtom,
} from "@/helpers/state";
import { ResizableHandle, ResizablePanel } from "./ui/resizable";
import Visualization from "./visualization";

export default function VisualizationPanel() {
  const mapCatalogQuery = useAtomValue(catalogQueriesAtom).getMapCatalogQuery();
  const analysis = useAtomValue(analysisAtom);
  const selectedGeographies = useAtomValue(selectedGeographiesAtom);
  const visualizationType = useAtomValue(visualizationTypeAtom);
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
          useAtom
          <ResizablePanel>
            <Visualization spec={visualizationSpecUrl} />
          </ResizablePanel>
        </>
      ) : null}
    </>
  );
}
