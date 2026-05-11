export type Analysis = {
  operation: string;
  dimension: string | null;
};

export type DatasetRequest = {
  variable: string;
  grid: string;
  time_unit: string;
};

export type Geography = number | [number, number];

export type Tag = {
  name: string;
};

export type Option<T> = {
  label: string;
  value: T;
};
