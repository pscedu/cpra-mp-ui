import Layout from "./layout";
import Map from "./map";
import MapControls from "./map-controls";
import MapSidebar from "./map-sidebar";
import VisualizationPanel from "./visualization-panel";

export default function MapPage() {
  return (
    <Layout>
      <Layout.Pane>
        <MapSidebar />
      </Layout.Pane>
      <Layout.Content padding="none" sx={{ position: "relative" }}>
        <Map />
        <MapControls />
        <VisualizationPanel />
      </Layout.Content>
    </Layout>
  );
}
