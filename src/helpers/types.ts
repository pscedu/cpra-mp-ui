import { Dataset } from "./dataset";
import { Grid } from "./structure";

export type SelectItem = {
  text: string;
  description?: string;
  disabled?: boolean;
  value?: any;
};

export type RasterStyleOptions = {
  bounds?: [number, number, number, number];
  dataset?: Dataset;
  grid?: Grid;
  layerName?: string;
  maxZoom?: number;
  order?: number;
  params?: [string, any][];
  sourceName?: string;
  tileSize?: number;
  tileUrls?: string[];
};
