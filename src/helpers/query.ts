import { Analysis, Geography } from "./types";

export type QueryOptions = {
  analysis?: Analysis | null;
  geographies?: Geography[] | null;
  includeTimeDimension?: boolean | null;
  maxGridCells?: number | null;
  maxValues?: number | null;
};
