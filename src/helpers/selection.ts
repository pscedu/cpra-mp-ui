import { Coordinate, Geography } from "./types";

// Selections made in the UI are always coordinates; cell IDs only appear when
// decoding a URL hash saved before selections became coordinate-based.
export const isCoordinate = (geography: Geography): geography is Coordinate =>
  Array.isArray(geography);

// Format a geography for display.
export const formatGeography = (geography: Geography) =>
  isCoordinate(geography) ? `(${geography.join(", ")})` : `${geography}`;

export class GeographySelection {
  geographies: Geography[];

  constructor(geographies: Geography[] = []) {
    this.geographies = geographies;
  }

  get length() {
    return this.geographies.length;
  }

  // Add a geography to the selection. Legacy cell IDs are discarded, since they
  // can be encoded neither alongside coordinates in the URL hash nor alongside
  // them in the geography query parameter.
  add(geography: Geography) {
    return new GeographySelection([
      ...this.geographies.filter(isCoordinate),
      geography,
    ]);
  }

  // The selection as it will exist once the user edits it, with legacy cell IDs
  // discarded. Editing affordances work from this rather than from the raw
  // selection so that the positions they offer match the result.
  editable() {
    return this.geographies.every(isCoordinate)
      ? this
      : new GeographySelection(this.geographies.filter(isCoordinate));
  }

  // Remove the selected geography at a particular index.
  remove(i: number) {
    const result = [...this.geographies];
    result.splice(i, 1);
    return new GeographySelection(result);
  }

  // Replace the selected geography at a particular index.
  replace(i: number, geography: Geography) {
    const result = [...this.geographies];
    result[i] = geography;
    return new GeographySelection(result);
  }

  // Rotate selected geographies by an offset.
  rotate(offset: number) {
    const result =
      offset == 0
        ? this.geographies
        : [
            ...this.geographies.slice(offset),
            ...this.geographies.slice(0, offset),
          ];
    return new GeographySelection(result);
  }
}
