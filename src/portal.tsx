import { Provider as JotaiProvider } from "jotai";
import { useAtom } from "jotai";
import { initEffectsAtom, store } from "./helpers/state";

import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "@/components/theme-provider";

import MapPage from "@/components/map-page";
import WorkerPage from "@/components/worker-page";
import { Suspense } from "react";

function EffectsInitializer() {
  // Initialize all effect atoms
  useAtom(initEffectsAtom);
  return null;
}

export default function Portal() {
  return (
    <JotaiProvider store={store}>
      <EffectsInitializer />
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <Suspense>
                  <MapPage />
                </Suspense>
              }
            />
            <Route path="/callback/login" element={<WorkerPage />} />
            <Route path="/callback/clickup" element={<WorkerPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </JotaiProvider>
  );
}
