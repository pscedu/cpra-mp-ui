import { createPortalState, PortalState } from "./helpers/state";

import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "@/components/theme-provider";

import MapPage from "@/components/map-page";
import WorkerPage from "@/components/worker-page";

export default function Portal() {
  const state = createPortalState();
  const loginWorker = (
    <WorkerPage action={state.completeLogin} heading="Completing login..." />
  );
  const clickupWorker = <WorkerPage action={state.linkClickup} />;
  return (
    <PortalState.Provider value={state}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/callback/login" element={loginWorker} />
            <Route path="/callback/clickup" element={clickupWorker} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </PortalState.Provider>
  );
}
