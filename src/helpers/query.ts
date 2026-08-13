import { Geography } from "./types";

export type QueryOptions = {
  analysis?: { operation: string; dimension: string | null } | null;
  geographies?: Geography[] | null;
  includeTimeDimension?: boolean | null;
  maxGeographies?: number | null;
  maxValues?: number | null;
  unpivot?: boolean | null;
};
