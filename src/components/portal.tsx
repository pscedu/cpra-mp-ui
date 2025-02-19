import { LocationProvider, ErrorBoundary, Router } from "preact-iso";
import { ThemeProvider, BaseStyles } from "@primer/react";
import { completeLogin, linkClickup } from "../helpers/auth";
import { PortalState, createPortalState } from "../helpers/state";

import MapPage from "./map-page";
import NotFoundPage from "./not-found-page";
import ProfilePage from "./profile-page";
import WorkerPage from "./worker-page";

export default function Portal() {
  return (
    <PortalState.Provider value={createPortalState()}>
      <ThemeProvider colorMode="auto">
        <BaseStyles>
          <LocationProvider>
            <ErrorBoundary>
              <Router>
                <MapPage path="/" />
                <ProfilePage path="/profile" />
                <WorkerPage
                  path="/callback/login"
                  action={completeLogin}
                  heading="Completing login..."
                />
                <WorkerPage path="/callback/clickup" action={linkClickup} />
                <NotFoundPage default />
              </Router>
            </ErrorBoundary>
          </LocationProvider>
        </BaseStyles>
      </ThemeProvider>
    </PortalState.Provider>
  );
}
