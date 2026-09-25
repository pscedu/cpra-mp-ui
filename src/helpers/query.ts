import { Analysis, Geography } from "./types";

export type QueryOptions = {
  analysis?: Analysis | null;
  derivedAnalysis?: string | null;
  geographies?: Geography[] | null;
  includeTimeDimension?: boolean | null;
  maxGridCells?: number | null;
  maxValues?: number | null;
};
