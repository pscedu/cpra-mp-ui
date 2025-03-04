import { usePortalState } from "../helpers/state";

import Visualization from "./visualization";
import FloatingPanel from "./floating-panel";

export default function VisualizationPanel({}) {
  const { visualizationSpec } = usePortalState();
  if (!visualizationSpec.value) return null;

  return (
    <FloatingPanel>
      <Visualization spec={visualizationSpec.value} />
    </FloatingPanel>
  );
}
