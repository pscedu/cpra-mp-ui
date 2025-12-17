export type Analysis = {
  operation: string;
  dimension: string;
};

export type DatasetRequest = {
  variable: string;
  grid: string;
  time_unit: string;
};
