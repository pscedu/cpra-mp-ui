import { Provider as JotaiProvider } from "jotai";

import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "@/components/theme-provider";

import MapPage from "@/components/map-page";
import WorkerPage from "@/components/worker-page";
import { store } from "./helpers/state";
import { useEffect } from "react";
import { hashEffect } from "./helpers/hash";

export default function Portal() {
  useEffect(() => hashEffect(store), []);
  return (
    <JotaiProvider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/callback/login" element={<WorkerPage />} />
            <Route path="/callback/clickup" element={<WorkerPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </JotaiProvider>
  );
}
