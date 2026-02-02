export type Analysis = {
  operation: string;
  dimension: string | null;
};

export type DatasetRequest = {
  variable: string;
  grid: string;
  time_unit: string;
};
