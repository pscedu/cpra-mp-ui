import { atom, WritableAtom, createStore } from "jotai";
import { atomWithRefresh, atomWithReset, atomWithStorage } from "jotai/utils";
import { observe } from "jotai-effect";
import { jwtDecode } from "jwt-decode";
import { CommentNode, exportTask, importTask } from "./clickup";
import { managementBaseUrl } from "./config";
import { hashAtom } from "./hash";
import { Dataset, getStructure } from "./structure";
import { getJson, getNdJson, sortConsistent } from "./utils";
import { NavigateFunction } from "react-router";
import { CatalogQueries } from "./catalog";
import { Analysis, DatasetRequest } from "./types";

export const store = createStore();

const tokenAtom = (key: string) =>
  atomWithStorage<string | null>(key, null, undefined, { getOnInit: true });
export const accessTokenAtom = tokenAtom("access_token");
export const refreshTokenAtom = tokenAtom("refresh_token");

export const structureAtom = atom(async () => await getStructure());
export const activityAtom = hashAtom("activity", "data");
export const issueAtom = hashAtom("issue", null);

export const requestedDatasetsAtom = atom<DatasetRequest[]>([
  {
    variable: "sal",
    grid: "hydro_compartment_v001",
    time_unit: "annual",
  },
]);
export const requestedFiltersAtom = atom({});
export const requestedTimeValuesAtom = atom([]);
export const catalogQueriesAtom = atom<
  CatalogQueries | Promise<CatalogQueries>
>(new Promise<CatalogQueries>(() => {}));

export const analysisAtom = atom<Analysis>({
  operation: "single",
  dimension: null,
});

const mapDataUrlAtom = atom((get) => {
  const cqs = get(catalogQueriesAtom);
  const analysis = get(analysisAtom);
  if ("queries" in cqs) return cqs.queries[0].getMapDataUrl(analysis);
  return null;
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
    const analysis = get(analysisAtom);

    // Update dataset requests.
    set(requestedDatasetsAtom, newRequests);

    // Reset selected geographies when the grid changes.
    if (updateGeographies && prevRequests[0].grid !== newRequests[0].grid)
      set(selectedGeographiesAtom, []);

    // Reset analysis when the variable changes.
    if (
      analysis.operation === "concatenate" &&
      newRequests[0].variable !== "lnd_type"
    )
      set(analysisAtom, { operation: "single", dimension: null });
  },
);

export const mapPositionAtom = hashAtom(
  "map",
  [8, 29.75, -91.5],
  (values) => values.map((value) => value.toFixed(2)).join("/"),
  (valueStr) => valueStr.split("/").map((value) => parseFloat(value)),
  true,
);

export const selectedGeographiesAtom = hashAtom<number[] | number[][]>(
  "geography",
  [],
  (values) => values.map((value) => value.toString()).join(","),
  (str) => {
    const geos = str.split(",");
    if (str.includes(".")) {
      const pairs = [];
      for (let i = 0; i < geos.length; i += 2)
        pairs.push(geos.slice(i, i + 2).map((coord) => parseFloat(coord)));
      return pairs;
    }
    return geos.map((geo) => parseInt(geo));
  },
);

export const maxSelectedGeographiesAtom = atom(10);

export const mapOptionsAtom = atom({
  showGridLabels: false,
  showGridLines: true,
  showProjects: true,
  showWater: false,
});

export const startDateAtom = hashAtom("start_date", null);
export const endDateAtom = hashAtom("end_date", null);

export const visualizationTypeAtom = hashAtom(
  "visualization",
  "time-series-line",
);

export const avatarCacheKeyAtom = atom(new Date().getTime());
export const mapFeatureValuesAtom = atom({} as any);
export const mapFeatureValuesLoadingAtom = atom(false);
export const mapTilesLoadingAtom = atom(false);
export const issueFilterTagsAtom = atom([] as any[]);
export const contextMenuAtom = atom(null as any);

export const reconcileStateAtom = atom(
  null,
  (
    get,
    set,
    { updateGeographies = false }: { updateGeographies?: boolean } = {},
  ) => {
    const datasets = get(datasetsAtom);
    if (!datasets.length) return;
    // TODO: Allow the user to select the map dataset.
    const mapDataset = datasets[0];
    const mapCatalogQuery = get(mapCatalogQueryAtom);
    const analysis = get(analysisAtom);

    if (analysis.dimension === "calendar_day")
      set(analysisTypeAtom, `${analysis.operation}:calendar_year`);
    if (analysis.dimension === "calendar_year")
      set(analysisTypeAtom, `${analysis.operation}:calendar_day`);
  },
);

export const tagOptionsAtom = atom(async (get) => {
  const structure = await get(structureAtom);
  const options = [];
  if (structure) {
    for (const dimension of structure.dimensions) {
      if (dimension.values) {
        options.push(
          ...dimension.values.map((dv: any) => ({
            value: `${dimension.name}:${dv.value}`,
            label: `${dimension.label}: ${dv.label || dv.value}`,
          })),
        );
      }
    }
  }
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
    set(requestedFiltersAtom, {
      ...filters,
      [dimensionName]: values,
    });
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

export const userAtom = atom(async (get) => {
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

export const taskAtom = atom<any | Promise<any>>(new Promise<any>(() => {}));

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
    set,
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
    set,
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
    get,
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
    get,
    set,
    { search, navigate }: { search: string; navigate: NavigateFunction },
  ) => {
    const query = new URLSearchParams(search);
    const user = get(userAtom);

    if (query.get("status") === "success") {
      set(userAtom, {
        ...user,
        clickupId: query.get("clickup_id"),
      });
    } else {
      // TODO: Add error handling for failed link operation.
    }
    navigate("/");
  },
);

// Update the selected geography at a particular index.
export const updateSelectedGeographyAtom = atom(
  null,
  (get, set, i: number, newGeo: any) => {
    const geos = get(selectedGeographiesAtom).slice();
    geos[i] = newGeo;
    set(selectedGeographiesAtom, geos);
  },
);

// Toggle whether the given geography is selected.
export const toggleGeographySelectedAtom = atom(null, (get, set, geo: any) => {
  const geos = get(selectedGeographiesAtom).slice();
  const idx = geos.indexOf(geo);
  if (idx === -1) geos.push(geo);
  else geos.splice(idx, 1);
  set(selectedGeographiesAtom, geos);
});

// Rotate selected geographies by an offset.
export const rotateSelectedGeographiesAtom = atom(
  null,
  (get, set, offset: number) => {
    const selectedGeographies = get(selectedGeographiesAtom);
    if (offset != 0)
      set(selectedGeographiesAtom, [
        ...selectedGeographies.slice(offset),
        ...selectedGeographies.slice(0, offset),
      ]);
  },
);

// Handle map key press.
// This logic is in the state instead of in the Map component
// to work around issues with stale values in the event handler.
export const handleMapKeyPressAtom = atom(
  null,
  async (get, set, e: KeyboardEvent) => {
    if (e.ctrlKey) {
      const selectionCount = get(selectedGeographiesAtom).length;
      const maxGeographies =
        (await get(visualizationAtom)).max_geographies || 10;
      if (selectionCount) {
        if (e.key === "ArrowLeft") set(rotateSelectedGeographiesAtom, -1);
        else if (e.key === "ArrowRight") set(rotateSelectedGeographiesAtom, 1);
      }
      if (selectionCount > maxGeographies) {
        if (e.key === "ArrowUp")
          set(rotateSelectedGeographiesAtom, -1 * maxGeographies);
        else if (e.key === "ArrowDown")
          set(rotateSelectedGeographiesAtom, maxGeographies);
      }
    } else if (e.key === "Escape") {
      set(selectedGeographiesAtom, []);
    }
  },
);

// Reset the activity when the user logs out
export const activityResetEffect = (get, set) => {
  const activity = get(activityAtom);
  const user = get(userAtom);

  if (activity !== "data" && !user) {
    set(activityAtom, "data");
  }
};

/* Effects */

// Query the catalog when datasets or filters change.
observe((get, set) => {
  const requestedDatasets = get(requestedDatasetsAtom);
  const requestedFilters = get(requestedFiltersAtom);
  (async () => {
    const structure = await get(structureAtom);

    const dsrSet = new Set(
      requestedDatasets.map(
        (dsr) => `${dsr.variable}|${dsr.grid}|${dsr.time_unit}`,
      ),
    );
    const cqs = new CatalogQueries(
      structure.datasets.filter((ds) =>
        dsrSet.has(`${ds.variable.name}|${ds.grid.name}|${ds.time_unit}`),
      ),
      requestedFilters,
      structure,
    );
    const prevCqs = get(catalogQueriesAtom);
    if ("equals" in prevCqs && prevCqs.equals(cqs)) return;
    await cqs.executeAll();
    set(catalogQueriesAtom, cqs);
    set(
      requestedTimeValuesAtom,
      cqs.queries[0].response.results[cqs.getTimeDimension().name],
    );
    // set(requestedFiltersAtom, cqs.combinedFilters);
  })();
}, store);

// Update map feature state when the dataset or filters change
let mapFeatureValuesAbortController: AbortController | null = null;
observe((get, set) => {
  const mapDataUrl = get(mapDataUrlAtom);

  (async () => {
    if (mapDataUrl) {
      if (mapFeatureValuesAbortController)
        mapFeatureValuesAbortController.abort("map state changed");
      mapFeatureValuesAbortController = new AbortController();

      set(mapFeatureValuesLoadingAtom, true);
      let data;
      try {
        data = await getNdJson(mapDataUrl, {
          signal: mapFeatureValuesAbortController.signal,
        });
      } catch (err) {
        if (err === "map state changed") return;
        throw err;
      }

      if (data.length === 1) {
        set(mapFeatureValuesAtom, data[0]);
        set(mapFeatureValuesLoadingAtom, false);
      } else {
        console.error(`Expected 1 row, received ${data.length}`, data);
      }
    } else {
      set(mapFeatureValuesAtom, {});
    }
  })();
}, store);

// Update the maximum selected geographies when the visualization changes.
observe((get, set) => {
  const visualizationPromise = get(visualizationAtom);
  (async () => {
    const visualization = await visualizationPromise;
    set(maxSelectedGeographiesAtom, visualization.max_geographies);
  })();
}, store);

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

// Log filters for debugging
observe((get) => {
  console.log("filters", get(requestedFiltersAtom));
}, store);
