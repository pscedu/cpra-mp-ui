import { isCoordinate } from "./selection";
import { Grid } from "./structure";
import { Coordinate, Geography } from "./types";

// Lookups already made, keyed by grid and coordinate. Which geography contains a
// coordinate depends on nothing but the two of them, so an answer is good for as
// long as the page lives. Promises rather than IDs are remembered, so that a
// coordinate being looked up when the next lookup starts — the map resolves its
// whole selection again whenever the style changes — shares the request already
// in flight instead of asking again.
const geographyIds = new Map<string, Promise<number | undefined>>();

const cacheKey = (grid: Grid, coordinate: Coordinate) =>
  `${grid.name}:${coordinate.join(",")}`;

/**
 * Resolve coordinates to the IDs of the geographies containing them.
 *
 * The whole set is asked about in one request, and each row of the response names
 * the coordinate it answers for. A coordinate that lands outside the grid is left
 * out of the response rather than given an empty row.
 *
 * @param {Grid} grid - The vector grid to resolve the coordinates on.
 * @param {Coordinate[]} coordinates - Longitude/latitude pairs.
 * @returns {Promise<(number | undefined)[]>} - One cell ID per coordinate, in the
 * same order, and undefined where a coordinate falls outside the grid.
 */
const resolveCoordinates = async (
  grid: Grid,
  coordinates: Coordinate[],
): Promise<(number | undefined)[]> => {
  const url = grid.getGeographyUrl(coordinates);
  const response = await fetch(url, {
    headers: { accept: "application/x-ndjson" },
  });
  // Thrown rather than reported as no geography, so that a request that failed
  // is not remembered as an answer.
  if (!response.ok)
    throw new Error(`Received status ${response.status} while loading ${url}`);

  // Collected by coordinate rather than by position, since the rows left out for
  // the coordinates outside the grid would put the rest out of step.
  const resolved = new Map<string, number>();
  (await response.text())
    .split("\n")
    .filter((line) => line.length > 0)
    .forEach((line) => {
      const row = JSON.parse(line);
      // Keyed on the numbers the coordinate was written from rather than on the
      // text of either request or response, so that the two spell it the same way.
      resolved.set(`${row.src_lng},${row.src_lat}`, row.dst_id as number);
    });

  return coordinates.map((coordinate) => resolved.get(coordinate.join(",")));
};

/**
 * Resolve selected geographies to the IDs of the grid cells they name.
 * @param {Grid} grid - The vector grid the geographies are selected on.
 * @param {Geography[]} geographies - The selection, as coordinates or cell IDs.
 * @returns {Promise<(number | undefined)[]>} - One ID per selected geography, in
 * the same order, and undefined where a coordinate falls outside the grid.
 */
export const resolveGeographyIds = (grid: Grid, geographies: Geography[]) => {
  // The coordinates still to look up, each named once, so that the whole
  // selection is covered by a single request asking nothing twice.
  const pending: Coordinate[] = [];
  const pendingKeys = new Set<string>();
  geographies.forEach((geography) => {
    // A legacy cell ID already names the geography it selects.
    if (!isCoordinate(geography)) return;
    const key = cacheKey(grid, geography);
    if (geographyIds.has(key) || pendingKeys.has(key)) return;
    pendingKeys.add(key);
    pending.push(geography);
  });

  if (pending.length) {
    const resolved = resolveCoordinates(grid, pending).catch((error) => {
      // Forgotten again, so that the lookup is tried once more the next time the
      // selection is drawn rather than leaving the cells unmarked until the page
      // is reloaded.
      pending.forEach((coordinate) =>
        geographyIds.delete(cacheKey(grid, coordinate)),
      );
      console.error(error);
      return pending.map(() => undefined);
    });
    pending.forEach((coordinate, i) =>
      geographyIds.set(
        cacheKey(grid, coordinate),
        resolved.then((ids) => ids[i]),
      ),
    );
  }

  return Promise.all(
    geographies.map((geography) =>
      isCoordinate(geography)
        ? geographyIds.get(cacheKey(grid, geography))
        : geography,
    ),
  );
};
