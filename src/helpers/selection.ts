import { Geography } from "./types";

export class GeographySelection<G extends Geography> {
  geographies: G[];

  constructor(geographies: G[] = []) {
    this.geographies = geographies;
  }

  get length() {
    return this.geographies.length;
  }

  // Replace the selected geography at a particular index.
  replace(i: number, geography: G) {
    const result = [...this.geographies];
    result[i] = geography;
    return new GeographySelection(result);
  }

  // Toggle whether the given geography is selected.
  toggle(geography: G) {
    const result = [...this.geographies];
    const idx = result.indexOf(geography);
    if (idx === -1) result.push(geography);
    else result.splice(idx, 1);
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
