import { ThemeProvider, BaseStyles } from "@primer/react";
import { PortalState, createPortalState } from "../helpers/state";

import Layout from "./layout";

export default function Portal() {
  return (
    <PortalState.Provider value={createPortalState()}>
      <ThemeProvider colorMode="auto">
        <BaseStyles>
          <Layout />
        </BaseStyles>
      </ThemeProvider>
    </PortalState.Provider>
  );
}
