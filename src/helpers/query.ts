export type QueryOptions = {
  analysis?: { operation: string; dimension: string | null } | null;
  geographies?: number[] | number[][] | null;
  includeTimeDimension?: boolean | null;
  maxGeographies?: number | null;
  maxValues?: number | null;
};
