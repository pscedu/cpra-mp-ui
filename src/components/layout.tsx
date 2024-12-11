import { SplitPageLayout } from "@primer/react";

import DimensionsSelect from "./dimensions-select";
import Map from "./map";
import NavBar from "./navbar";

export default function Layout() {
  return (
    <SplitPageLayout>
      <SplitPageLayout.Header padding="none">
        <NavBar />
      </SplitPageLayout.Header>
      <SplitPageLayout.Pane position="start" aria-label="Pane">
        <DimensionsSelect />
      </SplitPageLayout.Pane>
      <SplitPageLayout.Content width="full" padding="none">
        <Map />
      </SplitPageLayout.Content>
    </SplitPageLayout>
  );
}
