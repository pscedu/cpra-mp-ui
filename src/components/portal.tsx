import { LocationProvider, ErrorBoundary, Router } from "preact-iso";
import { ThemeProvider, BaseStyles } from "@primer/react";
import { PortalState, createPortalState } from "../helpers/state";

import MapPage from "./map-page";
import NotFoundPage from "./not-found-page";
import ProfilePage from "./profile-page";
import WorkerPage from "./worker-page";

export default function Portal() {
  const state = createPortalState();
  return (
    <PortalState.Provider value={state}>
      <ThemeProvider colorMode="auto">
        <BaseStyles>
          <LocationProvider>
            <ErrorBoundary>
              <Router>
                <MapPage path="/" />
                <ProfilePage path="/profile" />
                <WorkerPage
                  path="/callback/login"
                  action={state.completeLogin}
                  heading="Completing login..."
                />
                <WorkerPage
                  path="/callback/clickup"
                  action={state.linkClickup}
                />
                <NotFoundPage default />
              </Router>
            </ErrorBoundary>
          </LocationProvider>
        </BaseStyles>
      </ThemeProvider>
    </PortalState.Provider>
  );
}
