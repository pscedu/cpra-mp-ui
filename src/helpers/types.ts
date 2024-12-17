import { Grid } from "./structure";

export type SelectItem = {
  text: string;
  description?: string;
  disabled?: boolean;
  value?: any;
};

export type RasterStyleOptions = {
  bounds?: [number, number, number, number];
  grid?: Grid;
  layerName?: string;
  maxZoom?: number;
  order?: number;
  sourceName?: string;
  tileSize?: number;
  tileUrls?: string[];
};
