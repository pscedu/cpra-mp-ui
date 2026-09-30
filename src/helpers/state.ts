import { atom, WritableAtom, createStore } from "jotai";
import {
  atomWithRefresh,
  atomWithReset,
  atomWithStorage,
  useHydrateAtoms,
} from "jotai/utils";
import { useRef } from "react";
import { atomEffect, observe } from "jotai-effect";
import { jwtDecode } from "jwt-decode";
import { CommentNode, exportTask, importTask } from "./clickup";
import { managementBaseUrl, portalBaseUrl, qaqcTagOptions } from "./config";
import {
  getHashStringFromAtoms,
  hashAtom,
  hashObjectAtom,
  knownHashKeys,
} from "./hash";
import { isCoordinate } from "./selection";
import { Dataset, getStructure } from "./structure";
import { getJson, sortConsistent } from "./utils";
import { NavigateFunction } from "react-router";
import { CatalogQueries } from "./catalog";
import { Analysis, DatasetRequest, Geography } from "./types";

export const store = createStore();

const tokenAtom = (key: string) =>
  atomWithStorage<string | null>(key, null, undefined, { getOnInit: true });
export const accessTokenAtom = tokenAtom("access_token");
export const refreshTokenAtom = tokenAtom("refresh_token");

export const structureAtom = atom(async () => await getStructure());
export const activityAtom = hashAtom("data", { key: "activity" });
export const issueAtom = hashAtom(null, { key: "issue" });

export const defaultDatasets = [
  {
    variable: "sal",
    grid: "hydro_compartment_v001",
    time_unit: "daily",
  },
];
export const requestedDatasetsAtom = hashAtom<DatasetRequest[]>(
  defaultDatasets,
  {
    fromHash: (params) => {
      const variables = params.getAll("variable") || [];
      const grids = params.getAll("grid") || [];
      const timeUnits = params.getAll("time_unit") || [];
      const drs = variables.map((variable, i) => ({
        variable,
        grid: grids[i],
        time_unit: timeUnits[i],
      }));
      return drs.length ? drs : defaultDatasets;
    },
  },
);
export const requestedFiltersAtom = hashAtom<any>(
  {},
  {
    fromHash: (params) => {
      const uniqueKeys = new Set(params.keys());
      const value = {};
      for (const key of uniqueKeys)
        if (!knownHashKeys.includes(key)) value[key] = params.getAll(key);

      return value;
    },
  },
);
export const requestedTimeValuesAtom = atom([]);

type CatalogQueriesResolver = {
  resolve: (catalogQueries: CatalogQueries) => void;
};
export const initialCatalogQueriesAtom = atom<CatalogQueriesResolver | null>(
  null,
);
export const catalogQueriesAtom = hashAtom<
  CatalogQueries | Promise<CatalogQueries>
>(
  // Placeholder only; each provider (ScopeHydrate/HashDataProvider) hydrates
  // its own scoped promise/resolver pair before this is ever read.
  new Promise<CatalogQueries>(() => {}),
  {
    updateHash: (
      params: URLSearchParams,
      cqs: CatalogQueries | Promise<CatalogQueries>,
    ) => {
      // Not for an input-fixing analysis: its `datasets` is the one synthetic
      // stand-in built from the analysis's own output, whose "variable" is the
      // analysis name. Writing that triple would put a variable that exists on
      // no grid into the permalink, and `analysis=` already says everything
      // needed to rebuild the selection (`queryCatlogEffect`).
      if (
        "datasets" in cqs &&
        !cqs.structure.fixesOwnInputs(cqs.derivedAnalysis)
      )
        for (const { variable, grid, time_unit } of cqs.datasets) {
          params.append("variable", variable.name);
          params.append("grid", grid.name);
          params.append("time_unit", time_unit);
        }
      if ("combinedFilters" in cqs)
        for (const dimension of Object.keys(cqs.combinedFilters))
          for (const value of cqs.combinedFilters[dimension])
            params.append(dimension, value);
    },
  },
);

// Hydrates this component tree's own pending catalog-queries promise and
// resolver, scoped to whichever jotai store is active in its tree, rather
// than sharing the module-level placeholder above across all instances.
export const useHydrateCatalogQueries = () => {
  const pendingRef = useRef<
    | {
        promise: Promise<CatalogQueries>;
        resolve: (cqs: CatalogQueries) => void;
      }
    | undefined
  >(undefined);
  if (!pendingRef.current) {
    let resolve!: (cqs: CatalogQueries) => void;
    const promise = new Promise<CatalogQueries>((res) => (resolve = res));
    pendingRef.current = { promise, resolve };
  }

  useHydrateAtoms(
    new Map<
      typeof catalogQueriesAtom | typeof initialCatalogQueriesAtom,
      unknown
    >([
      [catalogQueriesAtom, pendingRef.current.promise],
      [initialCatalogQueriesAtom, { resolve: pendingRef.current.resolve }],
    ]),
  );
};

// The selection mode -- "single"/"compare", or a `kind === "dimension"`
// registered analysis (currently only "diff") applied over whatever
// variable is selected. Renamed from "analysis" to "mode" so that key can be
// reused for the selected DERIVED VARIABLE below; see `migrateLegacyAnalysisKey`
// for the one-time decode of old links still using "analysis" for this.
export const modeAtom = hashAtom<Analysis>(
  {
    operation: "single",
    dimension: null,
  },
  {
    key: "mode",
    encoder: ({ operation, dimension, order }) => {
      let valueStr = operation;
      if (dimension) valueStr += `:${dimension}`;
      if (order) valueStr += `:${order}`;
      return valueStr;
    },
    decoder: (valueStr) => {
      const [operation, dimension, order] = valueStr.split(":");
      return {
        operation,
        dimension: dimension || null,
        order: (order as "asc" | "desc") || null,
      };
    },
  },
);

// The selected `kind === "variable"` derived variable's name (e.g.
// "lnd_conf", "lnd_chng"), or `null` for a plain variable.
export const derivedAnalysisAtom = hashAtom<string | null>(null, {
  key: "analysis",
});

export const setRequestedDatasetsAtom = atom(
  null,
  (
    get,
    set,
    datasets: Dataset[],
    { updateGeographies } = { updateGeographies: true },
  ) => {
    const prevRequests = get(requestedDatasetsAtom);
    const newRequests = datasets.map((ds) => ({
      variable: ds.variable.name,
      grid: ds.grid.name,
      time_unit: ds.time_unit,
    }));
    // Update dataset requests.
    set(requestedDatasetsAtom, newRequests);

    // Discard legacy cell IDs when the grid changes, since they refer to cells
    // of the grid they were selected on. Coordinates are valid on any grid.
    if (updateGeographies && prevRequests[0].grid !== newRequests[0].grid)
      set(
        selectedGeographiesAtom,
        get(selectedGeographiesAtom).filter(isCoordinate),
      );

    // Reset the mode/derived variable if either no longer applies to the new
    // variable, per its catalog `variables` restriction (`null` means it
    // applies to any variable). "single"/"compare" are not registered
    // analyses, so the mode check is a no-op for them.
    //
    // `mode`/`derivedAnalysis` are read HERE, after the await, not captured
    // above alongside `prevRequests`. A caller that switches variable and
    // derived analysis together sets them in two statements (see
    // `dataset-select.tsx`'s `setVariable`), and this check resumes after both
    // have run. Reading them up front would test the OUTGOING selection
    // against the INCOMING variable and then clobber the incoming one: picking
    // "Land Type Plus" while "Land Confidence" was selected reset
    // `derivedAnalysisAtom` to null, because `lnd_conf` does not apply to the
    // dataset `lnd_type_plus` is offered under -- so the Variable menu
    // silently fell back to showing that dataset's plain variable instead.
    const structurePromise = get(structureAtom);
    (async () => {
      const structure = await structurePromise;
      const mode = get(modeAtom);
      const derivedAnalysis = get(derivedAnalysisAtom);
      const selectedMode = structure.analysesMap[mode.operation];
      if (selectedMode && !selectedMode.appliesTo(newRequests[0].variable))
        set(modeAtom, { operation: "single", dimension: null });
      if (
        derivedAnalysis &&
        !structure.analysesMap[derivedAnalysis]?.appliesTo(
          newRequests[0].variable,
        )
      )
        set(derivedAnalysisAtom, null);
    })();
  },
);

export const mapPositionAtom = hashAtom([8, 29.75, -91.5], {
  key: "map",
  encoder: (values) => values.map((value) => value.toFixed(2)).join("/"),
  decoder: (valueStr) => valueStr.split("/").map((value) => parseFloat(value)),
  includeDefault: true,
});

export const selectedGeographiesAtom = hashAtom<Geography[]>([], {
  key: "geography",
  encoder: (values) => values.map((value) => value.toString()).join(","),
  // Coordinates are always encoded with decimals and cell IDs never are, so the
  // two can be told apart. A selection never holds both at once, since editing
  // one that was restored from a legacy hash discards its cell IDs.
  decoder: (str) => {
    const geos = str.split(",");
    if (str.includes(".")) {
      const pairs = [];
      for (let i = 0; i < geos.length; i += 2)
        pairs.push(geos.slice(i, i + 2).map((coord) => parseFloat(coord)));
      return pairs as Geography[];
    }
    return geos.map((geo) => parseInt(geo));
  },
});

export const maxSelectedGeographiesAtom = atom(10);

export const mapOptionsAtom = hashObjectAtom<boolean>({
  showGridLabels: false,
  showGridLines: true,
  showProjects: true,
  showWater: false,
});

export const startDateAtom = hashAtom<string | null>(null, {
  key: "start_date",
});
export const endDateAtom = hashAtom<string | null>(null, { key: "end_date" });

export const visualizationTypeAtom = hashAtom("time-series-line", {
  key: "visualization",
});

export const avatarCacheKeyAtom = atom(new Date().getTime());
export const mapTilesLoadingAtom = atom(false);
export const issueFilterTagsAtom = atom([] as any[]);

export const tagOptionsAtom = atom(async (get) => {
  const structure = await get(structureAtom);
  const options = [...qaqcTagOptions];
  if (structure) {
    for (const dimension of structure.dimensions) {
      if (dimension.values) {
        options.push(
          ...dimension.values.map((dv: any) => ({
            value: `${dimension.name}:${dv.value}`.toLowerCase(),
            label: `${dimension.label}: ${dv.label || dv.value}`,
          })),
        );
      }
    }
  }
  options.sort((a, b) => (a.label < b.label ? -1 : 1));
  return options;
});

export const visualizationAtom = atom(async (get) => {
  const structure = await get(structureAtom);
  const visualizationType = get(visualizationTypeAtom);
  return structure.visualizationsMap[visualizationType];
});

export const setSelectedFilterChoicesAtom = atom(
  null,
  (get, set, dimensionName: string, values: any[], sort = true) => {
    const filters = get(requestedFiltersAtom);
    if (sort) sortConsistent(values, filters[dimensionName]);
    const newFilters = {
      ...filters,
      [dimensionName]: values,
    };
    if (dimensionName === "calendar_day" && "calendar_year" in newFilters)
      delete newFilters["calendar_year"];
    if (dimensionName === "calendar_year" && "calendar_day" in newFilters)
      delete newFilters["calendar_day"];
    set(requestedFiltersAtom, newFilters);
  },
);

const getManagementJson = async (
  get,
  relativeUrl: string,
  { accessToken = null, body = null, method = "GET" } = {},
) => {
  const res = await getJson(`${managementBaseUrl}${relativeUrl}`, {
    body,
    headers: {
      authorization: `Bearer ${accessToken ?? get(accessTokenAtom)}`,
      "content-type": "application/json",
    },
    method,
  });
  if (res.error && res.error.status === 401) {
    // Try to obtain a new access token using the refresh token.
    if (!accessToken && (await refreshAccessToken(get)))
      return await getManagementJson(get, relativeUrl, {
        accessToken,
        body,
        method,
      });
    store.set(accessTokenAtom, null);
    store.set(refreshTokenAtom, null);
  }
  return res;
};

const refreshAccessToken = async (get) => {
  const refreshToken = store.get(refreshTokenAtom);
  if (!refreshToken) return false;
  const data = await getManagementJson(get, "/login/refresh", {
    accessToken: refreshToken,
  });
  if (data.error) return false;
  store.set(accessTokenAtom, data.accessToken);
  return true;
};

export const userAtom = atomWithRefresh(async (get) => {
  const result = await getManagementJson(get, "/users/current_user");
  return result.error ? null : result;
});

export const usersAtom = atom(async (get) => {
  const user = await get(userAtom);
  if (!user?.clickupId) return [];
  const usersData = await getManagementJson(get, "/users/");
  return usersData.sort((a: any, b: any) => (a.fullName < b.fullName ? -1 : 1));
});

export const taskStatusesAtom = atom(async (get) => {
  const statuses = await getManagementJson(get, "/statuses/");
  return statuses.error ? [] : statuses;
});

export const tasksAtom = atomWithRefresh(async (get) => {
  const issueFilterTags = get(issueFilterTagsAtom);
  const params = new URLSearchParams();
  if (issueFilterTags)
    for (const tag of issueFilterTags) params.append("tags", tag.value);
  const tasksData = await getManagementJson(get, `/tasks/?${params}`);
  return tasksData.map(importTask);
});

export const taskAtom = atomWithReset<any | Promise<any>>(
  new Promise<any>(() => {}),
);

export const createTaskAtom = atom(null, async (get, set, task: any) => {
  return await getManagementJson(get, "/tasks/", {
    body: exportTask(task),
    method: "POST",
  });
});

export const createCommentAtom = atom(
  null,
  async (
    get,
    _set,
    {
      taskId,
      comment,
    }: {
      taskId: string;
      comment: { assignee?: any; comment: CommentNode | CommentNode[] };
    },
  ) => {
    return await getManagementJson(get, `/tasks/${taskId}/comments`, {
      body: comment,
      method: "POST",
    });
  },
);

export const updateCommentAtom = atom(
  null,
  async (
    get,
    _set,
    { commentId, commentUpdates }: { commentId: string; commentUpdates: any },
  ) => {
    return await getManagementJson(get, `/comments/${commentId}`, {
      body: commentUpdates,
      method: "PUT",
    });
  },
);

export const updateTaskAtom = atom(null, async (get, set, taskUpdates: any) => {
  const task = get(taskAtom);
  return await getManagementJson(get, `/tasks/${task.id}`, {
    body: exportTask(taskUpdates),
    method: "PUT",
  });
});

export const completeLoginAtom = atom(
  null,
  async (
    _get,
    set,
    {
      search,
      navigate,
      status,
    }: {
      search: string;
      navigate: NavigateFunction;
      status: {
        description: WritableAtom<any, any, any>;
        heading: WritableAtom<any, any, any>;
        status: WritableAtom<any, any, any>;
      };
    },
  ) => {
    const query = new URLSearchParams(search);
    const loginError = (msg: string) => {
      set(status.description, msg);
      set(status.heading, "Login error");
      set(status.status, "error");
    };

    if (!query.has("access_token") || !query.has("refresh_token"))
      return loginError("Required token parameters are missing.");

    const accessToken = query.get("access_token") as string;
    const refreshToken = query.get("refresh_token") as string;

    try {
      jwtDecode(accessToken);
    } catch (err) {
      return loginError(err as string);
    }

    set(accessTokenAtom, accessToken);
    set(refreshTokenAtom, refreshToken);

    navigate("/");
  },
);

export const linkClickupAtom = atom(
  null,
  (
    _get,
    set,
    { search, navigate }: { search: string; navigate: NavigateFunction },
  ) => {
    const query = new URLSearchParams(search);
    if (query.get("status") === "success") {
      // Refresh the user record.
      set(userAtom);
    } else {
      // TODO: Add error handling for failed link operation.
    }
    navigate("/");
  },
);

// Set the executed catalog queries and related atoms.
// This needs to be in its own write-only atom for Reach state batching to work property.
// Otherwise, React tries to rerender components in the middle of updates.
export const setExecutedCatalogQueriesAtom = atom(
  null,
  (get, set, cqs: CatalogQueries) => {
    set(catalogQueriesAtom, cqs);
    const resolver = get(initialCatalogQueriesAtom);
    if (resolver) {
      resolver.resolve(cqs);
      set(initialCatalogQueriesAtom, null);
    }
    set(
      requestedTimeValuesAtom,
      cqs.queries[0].response.results[cqs.getTimeDimension().name],
    );
    // Update the mode's dimension if needed.
    const mode = get(modeAtom);
    const timeDimName = cqs.getTimeDimension().name;
    if (
      mode.dimension &&
      ["calendar_day", "calendar_year"].includes(mode.dimension) &&
      mode.dimension !== timeDimName
    )
      set(modeAtom, { ...mode, dimension: timeDimName });
  },
);

const downloadSettingsAtom = (key: string, defaultValue: string) =>
  atomWithStorage<string>(key, defaultValue, undefined, { getOnInit: true });
export const chartImageFormatAtom = downloadSettingsAtom(
  "chart-image-format",
  "png",
);
export const geometryDataFormatAtom = downloadSettingsAtom(
  "geometry-data-format",
  "zip",
);
export const tabularDataFormatAtom = downloadSettingsAtom(
  "tabular-data-format",
  "csv",
);

export const dataPermalinkAtom = atom((get) => {
  const hashString = getHashStringFromAtoms(get, {
    exclude: ["activity", "issue"],
  });
  return `${portalBaseUrl}${hashString}`;
});

/* Effects */

// Query the catalog when datasets or filters change.
export const queryCatlogEffect = atomEffect((get, set) => {
  const requestedDatasets = get(requestedDatasetsAtom);
  const requestedFilters = get(requestedFiltersAtom);
  const derivedAnalysis = get(derivedAnalysisAtom);
  // Effects run before the atoms have been hydrated, so we need to check
  // to make sure we have requested datasets.
  if (requestedDatasets.length)
    (async () => {
      const structure = await get(structureAtom);

      // An input-fixing analysis has no requested dataset to match, and never
      // really had one: its dataset is the synthetic stand-in `Structure`
      // built from what the API says the analysis outputs, and the triple in
      // the hash beside it is whatever the reader last had selected. Take the
      // analysis's own dataset and ignore the triple rather than filtering
      // `structure.datasets` for a variable named after an analysis, which
      // matches nothing and leaves the map with no query at all.
      const dsrSet = new Set(
        requestedDatasets.map(
          (dsr) => `${dsr.variable}|${dsr.grid}|${dsr.time_unit}`,
        ),
      );
      const ownDataset = structure.fixesOwnInputs(derivedAnalysis)
        ? structure.derivedDatasetsMap[derivedAnalysis]?.dataset
        : null;
      const datasets = ownDataset
        ? [ownDataset]
        : structure.datasets.filter((ds) =>
            dsrSet.has(`${ds.variable.name}|${ds.grid.name}|${ds.time_unit}`),
          );

      const cqs = new CatalogQueries(
        datasets,
        requestedFilters,
        structure,
        derivedAnalysis,
      );
      const prevCqs = get(catalogQueriesAtom);
      if ("equals" in prevCqs && prevCqs.equals(cqs)) return;
      await cqs.executeAll();
      set(setExecutedCatalogQueriesAtom, cqs);
    })();
});

// Update the maximum selected geographies when the visualization changes.
export const updateMaxSelectedGeographiesEffect = atomEffect((get, set) => {
  const visualizationPromise = get(visualizationAtom);
  (async () => {
    const visualization = await visualizationPromise;
    set(maxSelectedGeographiesAtom, visualization.max_grid_cells);
  })();
});

// Update the task when the issue changes.
observe((get, set) => {
  const issue = get(issueAtom);
  if (issue === "new")
    set(taskAtom, {
      assignees: [],
      tags: [],
      markdown_description: "",
      name: "",
    });
  else if (issue) {
    set(taskAtom, new Promise(() => {}));
    (async () => {
      const taskData = await getManagementJson(
        get,
        `/tasks/${issue}?getComments=true`,
      );
      set(taskAtom, importTask(taskData));
    })();
  }
}, store);

// Reset the activity when the user logs out
export const userActivityEffect = atomEffect((get, set) => {
  const activity = get(activityAtom);
  const userPromise = get(userAtom);

  (async () => {
    const user = await userPromise;
    if (activity !== "data" && !user) {
      set(activityAtom, "data");
    }
  })();
});
