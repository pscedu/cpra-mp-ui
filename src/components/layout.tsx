import { SplitPageLayout } from "@primer/react";

import DimensionsSelect from "./dimensions-select";
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
      <SplitPageLayout.Content>
        <p>Content area</p>
      </SplitPageLayout.Content>
      <SplitPageLayout.Footer>
        <p>Footer</p>
      </SplitPageLayout.Footer>
    </SplitPageLayout>
  );
}
