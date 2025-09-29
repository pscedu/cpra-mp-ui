export type QueryOptions = {
  analysis?: { operation: string; dimension: string | null };
  geographies?: number[] | number[][] | null;
  maxGeographies?: number | null;
};
