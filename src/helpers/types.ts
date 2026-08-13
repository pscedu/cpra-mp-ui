export type Analysis = {
  operation: string;
  dimension: string | null;
};

export type DatasetRequest = {
  variable: string;
  grid: string;
  time_unit: string;
};

export type Coordinate = [number, number];

// A vector grid cell ID. Only ever produced by decoding a URL hash saved before
// selections became coordinate-based; selections made in the UI are always
// coordinates.
export type LegacyCellId = number;

export type Geography = Coordinate | LegacyCellId;

export type Tag = {
  name: string;
};

export type Option<T> = {
  label: string;
  value: T;
};
