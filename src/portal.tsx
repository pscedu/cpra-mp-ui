import { Provider, useSetAtom } from "jotai";
import { useStateEffects } from "./helpers/useStateEffects";

import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "@/components/theme-provider";

import MapPage from "@/components/map-page";
import WorkerPage from "@/components/worker-page";
import { completeLoginAtom, linkClickupAtom } from "./helpers/state";

function PortalContent() {
  const completeLogin = useSetAtom(completeLoginAtom);
  const linkClickup = useSetAtom(linkClickupAtom);
  useStateEffects();

  const loginWorker = (
    <WorkerPage action={completeLogin} heading="Completing login..." />
  );
  const clickupWorker = <WorkerPage action={linkClickup} />;

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/callback/login" element={loginWorker} />
          <Route path="/callback/clickup" element={clickupWorker} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default function Portal() {
  return (
    <Provider>
      <PortalContent />
    </Provider>
  );
}
