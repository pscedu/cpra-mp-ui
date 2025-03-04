import DimensionsSelect from "./dimensions-select";
import Layout from "./layout";
import Map from "./map";
import MapControls from "./map-controls";
import VisualizationPanel from "./visualization-panel";

export default function MapPage() {
  return (
    <Layout>
      <Layout.Pane>
        <DimensionsSelect />
      </Layout.Pane>
      <Layout.Content padding="none" sx={{ position: "relative" }}>
        <Map />
        <MapControls />
        <VisualizationPanel />
      </Layout.Content>
    </Layout>
  );
}
