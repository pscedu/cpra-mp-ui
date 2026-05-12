import { Provider as JotaiProvider } from "jotai";

import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "@/components/theme-provider";

import MapPage from "@/components/map-page";
import WorkerPage from "@/components/worker-page";
import { store } from "./helpers/state";
import { HashDataProvider } from "./components/hash-data-provider";

export default function Portal() {
  return (
    <JotaiProvider store={store}>
      <HashDataProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MapPage />} />
              <Route path="/callback/login" element={<WorkerPage />} />
              <Route path="/callback/clickup" element={<WorkerPage />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </HashDataProvider>
    </JotaiProvider>
  );
}
