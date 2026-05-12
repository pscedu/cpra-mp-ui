import { useAtomValue } from "jotai";
import { selectedGeographiesAtom } from "@/helpers/state";

import { LoaderCircle } from "lucide-react";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import Chart from "@/components/chart";

export default function VisualizationPanel() {
  const selectedGeographies = useAtomValue(selectedGeographiesAtom);

  return selectedGeographies.length ? (
    <>
      <ResizableHandle className="h-16" />
      <ResizablePanel>
        <Chart>
          <LoaderCircle className="animate-spin absolute" />
        </Chart>
      </ResizablePanel>
    </>
  ) : null;
}
