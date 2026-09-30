// Live round-trip over every URL the portal builds. Drives the portal's REAL
// helpers -- `getStructure`, `CatalogQuery`, `Visualization.getSpecUrl` --
// against a running API, then fetches every URL they build and reports the
// status. The point is that no URL in here is written by hand: a builder that
// disagrees with the routes shows up as a 4xx rather than as a passing
// re-implementation of what the builder was supposed to do. Which charts to
// probe is asked of `Structure.offeredVisualizations` for the same reason --
// it is the function the picker itself calls, not a copy of its predicate.
//
// Run with the server from the plan's Verification section on port 8877:
//   VITE_DATA_BASE_URL=http://127.0.0.1:8877/v1 \
//     npx vite-node -c vite.probe.config.ts probe.ts
import { CatalogQuery } from "./src/helpers/catalog";
import { getStructure, Structure } from "./src/helpers/structure";

const SINGLE = { operation: "single", dimension: null } as any;

// The coordinate from the reported `lnd_chng` chart failure. A chart needs a
// geography, and naming one is also what makes `getSpecUrl` omit
// `calendar_year` -- the shape the whole time-series path turns on.
const GEOGRAPHIES = [[-92.21787, 29.71833]] as any;

let failures = 0;

// A KNOWN gap, reported but not counted, so the exit code stays a regression
// signal rather than a permanent red.
//
// The `sediment-dynamics` chart fixes its own analysis (`sediment_dynamics`,
// `kind="internal"`). Selecting a derived analysis on top makes the chain
// `sediment_dynamics,<other>`, and the server allows only a `kind="dimension"`
// analysis after the first stage -- `diff` is the only one -- so `lnd_chng` and
// `lnd_conf` come back 400. `Structure.offeredVisualizations` cannot filter this
// out: nothing in `/v1/visualizations.json` says which analysis a visualization
// implies, and inferring it by un-hyphenating the name would be a coincidence,
// not a contract. The fix is an `analysis` field on the visualization catalog
// entry; until then the picker offers a combination the server refuses.
const isKnownChainGap = (
  structure: Structure,
  visualizationName: string,
  derivedAnalysis: string | null,
) =>
  visualizationName === "sediment-dynamics" &&
  derivedAnalysis !== null &&
  structure.analysesMap[derivedAnalysis]?.kind !== "dimension";

// The other KNOWN condition, and this one is about the fixtures rather than the
// code: `data-long` carries no raster crosswalk rasters at all, so any request
// that has to reproject between grids 404s naming the file it wanted.
// `lnd_type_plus` reads three variables across grids, so its download is the one
// that hits it. Matched on the message rather than on the status, because a bare
// 404 is exactly what a genuine routing regression would also look like.
const MISSING_FIXTURE = /no raster crosswalk from/;

// `known` is `true` for a gap this probe knows about regardless of the response,
// or a pattern that must match the error body for the miss to be excused.
const check = async (
  what: string,
  url: string | null,
  known: boolean | RegExp = false,
) => {
  if (!url) {
    console.log(`  FAIL ${what}: no URL built`);
    failures++;
    return;
  }
  const response = await fetch(url, { headers: { accept: "*/*" } });
  const ok = response.status >= 200 && response.status < 300;
  const body = ok ? "" : (await response.text()).slice(0, 200);
  const excused = known instanceof RegExp ? known.test(body) : known;
  if (!ok && !excused) failures++;
  const tag = ok ? "ok  " : excused ? "KNOWN" : "FAIL";
  console.log(`  ${tag} ${what} [${response.status}]${ok ? "" : ` :: ${body}`}`);
  console.log(`       ${url}`);
};

// Everything a selection drives, built the way `state.ts` builds it.
const exercise = async (
  structure: Structure,
  label: string,
  dataset: any,
  derivedAnalysis: string | null,
  format: string,
) => {
  console.log(`\n== ${label}`);
  const query = new CatalogQuery(dataset, {}, structure, derivedAnalysis);
  console.log(`  catalog: ${query.requestPath}`);
  await query.execute();
  if (query.response?.error) {
    console.log(`  FAIL catalog request: ${JSON.stringify(query.response)}`);
    failures++;
    return;
  }
  console.log(
    `  output: grid=${query.response.output.grid}` +
      ` time_unit=${query.response.output.time_unit}` +
      ` legend=${query.response.output.legend}`,
  );

  await check(
    `${format} download`,
    query.getDataDownloadUrl({
      analysis: SINGLE,
      derivedAnalysis,
      format,
      includeTimeDimension: true,
    }),
    // Excused at every call site rather than just the one that trips it today,
    // because the pattern names the fixture that is missing -- a routing bug
    // would 404 with something else.
    MISSING_FIXTURE,
  );
  await check(
    "map style",
    query.getMapStyleUrl({
      analysis: SINGLE,
      derivedAnalysis,
      mapOptions: { isOverlay: true, showWater: false },
    }),
  );

  // Every chart a reader could actually pick here, asked of the picker's own
  // function. An empty list is itself the interesting answer for an analysis
  // whose result has no time column, so it is reported rather than skipped.
  const offered = structure.offeredVisualizations(
    derivedAnalysis,
    dataset.variable.name,
  );
  console.log(
    `  charts offered: ${offered.map((viz) => viz.name).join(", ") || "(none)"}`,
  );
  for (const visualization of offered) {
    await check(
      `${visualization.name} spec`,
      query.getVisualizationUrl({
        visualizationType: visualization.name,
        selectedGeographies: GEOGRAPHIES,
        analysis: SINGLE,
        derivedAnalysis,
      }),
      isKnownChainGap(structure, visualization.name, derivedAnalysis),
    );
  }
};

// A 200 was never the thing to check for a time-series chart: the pre-rewrite
// `lnd_chng` bug was a 200 whose data URL had been stripped of `calendar_year`
// as a collapsed dimension, so the spec's time transform read a field that was
// not there and the chart came back empty. Follow the spec to its data and
// count the years.
const checkTimeSeries = async (
  structure: Structure,
  label: string,
  dataset: any,
  derivedAnalysis: string | null,
) => {
  const query = new CatalogQuery(dataset, {}, structure, derivedAnalysis);
  // `getQueryParams` reads `response.results` for the filter values, so the
  // catalog request has to have happened -- a builder called on an unexecuted
  // query throws rather than returning a bad URL.
  await query.execute();
  const url = query.getVisualizationUrl({
    visualizationType: "time-series-line",
    selectedGeographies: GEOGRAPHIES,
    analysis: SINGLE,
    derivedAnalysis,
  });
  if (!url) {
    console.log(`  FAIL ${label}: no time-series URL built`);
    failures++;
    return;
  }
  const spec = await (await fetch(url)).json();
  const dataUrl = spec?.data?.url;
  if (!dataUrl) {
    console.log(`  FAIL ${label}: spec carries no data URL`);
    failures++;
    return;
  }
  if (!/select=[^&]*calendar_year/.test(dataUrl)) {
    console.log(`  FAIL ${label}: calendar_year dropped from select`);
    console.log(`       ${dataUrl}`);
    failures++;
    return;
  }
  const rows = (await (await fetch(dataUrl)).text()).trim().split("\n").slice(1);
  const years = new Set(rows.map((row) => row.split(",")[0]));
  const ok = years.size > 1;
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${label}: ${years.size} distinct years`);
};

const structure = await getStructure();
console.log(
  `structure: ${structure.datasets.length} datasets,` +
    ` ${structure.derivedDatasets.length} derived`,
);

// A plain dataset: the triple still goes on every URL.
const plain = structure.datasets.find(
  (ds) =>
    ds.variable.name === "lnd_type" &&
    ds.time_unit === "annual" &&
    ds.grid.name === "morph_pixel_v002",
);
await exercise(structure, "plain lnd_type/annual/morph_pixel_v002", plain, null, "tif");

// The same dataset under each analysis that reads it -- the four cases the
// reported Time Series Line failure spanned.
await exercise(structure, "lnd_chng over lnd_type", plain, "lnd_chng", "tif");
await exercise(structure, "lnd_conf over lnd_type", plain, "lnd_conf", "tif");

// The rewrite's contract: no `calendar_year` on the request, a year per row back.
console.log("\n== land-change series over time");
await checkTimeSeries(structure, "lnd_chng time series", plain, "lnd_chng");

// The input-fixing analysis: no triple anywhere, `analysis=` instead, and a
// dataset that only exists because `/v1/analyses.json` said what it outputs.
const derived = structure.derivedDatasetsMap["lnd_type_plus"];
if (!derived) {
  console.log("\nFAIL no DerivedDataset for lnd_type_plus");
  failures++;
} else {
  const { dataset } = derived;
  console.log(
    `\nsynthetic dataset: variable=${dataset.variable.name}` +
      ` grid=${dataset.grid.name} (${dataset.grid.grid_type})` +
      ` time_unit=${dataset.time_unit}` +
      ` legend=${dataset.variable.legend?.name ?? null}` +
      ` isRaster=${dataset.grid.isRaster()}`,
  );
  await exercise(structure, "derived lnd_type_plus", dataset, "lnd_type_plus", "tif");
}

// The old-permalink shape: `analysis=lnd_type_plus` alongside the legacy
// triple the portal used to invent. The triple must not reach the request.
const stale = structure.datasets.find((ds) => ds.variable.name === "stg");
const staleQuery = new CatalogQuery(
  derived ? derived.dataset : stale,
  { variable: ["stg"], grid: ["hydro_compartment_v002"], time_unit: ["annual"] },
  structure,
  "lnd_type_plus",
);
const carriesTriple = /[?&](variable|grid|time_unit)=/.test(staleQuery.requestPath);
console.log(`\n== old permalink (analysis + legacy triple)`);
console.log(`  ${carriesTriple ? "FAIL" : "ok  "} triple kept out of the request`);
if (carriesTriple) failures++;
await check("catalog", staleQuery.requestPath);

console.log(failures ? `\n${failures} FAILURE(S)` : "\nall probes passed");
process.exit(failures ? 1 : 0);
