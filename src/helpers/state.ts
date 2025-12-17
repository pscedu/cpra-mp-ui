import { atom, WritableAtom, createStore } from "jotai";
import { observe } from "jotai-effect";
import { jwtDecode } from "jwt-decode";
import { loadUser, saveUser } from "./auth";
import { CommentNode, exportTask, importTask } from "./clickup";
import { managementBaseUrl } from "./config";
import { hashAtom } from "./hash";
import { Dataset, getStructure } from "./structure";
import { getJson, getNdJson, sortConsistent } from "./utils";
import { NavigateFunction } from "react-router";
import { CatalogQueries } from "./catalog";
import { Analysis, DatasetRequest } from "./types";

export const store = createStore();

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
export const tasksAtom = atom(null as any);
export const taskAtom = atom(null as any);
export const userAtom = atom(loadUser() as any);
export const usersAtom = atom([] as any[]);
export const avatarCacheKeyAtom = atom(new Date().getTime());
export const mapFeatureValuesAtom = atom({} as any);
export const mapFeatureValuesLoadingAtom = atom(false);
export const mapTilesLoadingAtom = atom(false);
export const issueFilterTagsAtom = atom([] as any[]);
export const taskStatusesAtom = atom(null as any);
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

// ============================================================================
// Action Atoms (Write-only atoms for complex operations)
// ============================================================================

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

// ============================================================================
// Management API Actions
// ============================================================================

const getManagementJson = async (
  get: any,
  relativeUrl: string,
  {
    accessToken = null,
    body = null,
    method = "GET",
    tryRefresh = true,
  }: any = {},
) => {
  const user = get(userAtom);
  const res = await getJson(`${managementBaseUrl}${relativeUrl}`, {
    body,
    headers: {
      authorization: `Bearer ${accessToken ? accessToken : user?.accessToken}`,
      "content-type": "application/json",
    },
    method,
  });
  return res;
};

export const refreshAccessTokenAtom = atom(null, async (get, set) => {
  const user = get(userAtom);
  const refreshToken = user?.refreshToken;
  if (!refreshToken) return false;

  const data = await getManagementJson(get, "/login/refresh", {
    accessToken: refreshToken,
    tryRefresh: false,
  });
  if (data.error) return false;
  set(userAtom, { ...user, accessToken: data.accessToken });
  return true;
});

export const getUserInfoAtom = atom(
  null,
  async (get, set, settings: any = {}) => {
    const result = await getManagementJson(
      get,
      "/users/current_user",
      settings,
    );
    if (result.error && result.error.status === 401) {
      // Try to obtain a new access token using the refresh token.
      if (settings.tryRefresh !== false && (await set(refreshAccessTokenAtom)))
        return await set(getUserInfoAtom, settings);
      set(userAtom, null);
    }
    return result;
  },
);

export const getTasksAtom = atom(
  null,
  async (get, set, { tags }: { tags?: any[] } = {}) => {
    const params = new URLSearchParams();
    if (tags) for (const tag of tags) params.append("tags", tag.value);
    return await getManagementJson(get, `/tasks?${params}`);
  },
);

export const getTaskAtom = atom(
  null,
  async (
    get,
    set,
    { taskId, getComments = false }: { taskId: string; getComments?: boolean },
  ) => {
    return await getManagementJson(
      get,
      `/tasks/${taskId}?getComments=${getComments.toString()}`,
    );
  },
);

export const createTaskAtom = atom(null, async (get, set, task: any) => {
  return await getManagementJson(get, "/tasks", {
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

export const getStatusesAtom = atom(
  null,
  async (get, set) => await getManagementJson(get, "/statuses"),
);

export const reloadTaskAtom = atom(null, async (get, set) => {
  const issue = get(issueAtom);
  set(taskAtom, null);

  if (issue === "new")
    set(taskAtom, {
      assignees: [],
      tags: [],
      markdown_description: "",
      name: "",
    });
  else if (issue) {
    const taskData = await set(getTaskAtom, {
      taskId: issue,
      getComments: true,
    });
    set(taskAtom, importTask(taskData));
  }
});

export const reloadTasksAtom = atom(null, async (get, set) => {
  const issueFilterTags = get(issueFilterTagsAtom);
  set(tasksAtom, null);

  const tasksData = await set(getTasksAtom, { tags: issueFilterTags });
  set(tasksAtom, tasksData.map(importTask));
});

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

    const currentUser: any = await set(getUserInfoAtom, {
      accessToken: accessToken,
    });

    if (currentUser?.error) return loginError("Failed to get user information");

    set(userAtom, {
      ...(currentUser as any),
      accessToken: accessToken,
      refreshToken: refreshToken,
    });

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

// Reload user information when the application loads
export const userInfoEffect = (get, set) => {
  const user = get(userAtom);

  if (user) {
    (async () => {
      const userInfo: any = await set(getUserInfoAtom, {});
      set(userAtom, userInfo?.error ? null : { ...user, ...(userInfo as any) });
    })();
  }
};

// Save user information to local storage when it changes
export const userPersistenceEffect = (get, set) => {
  const user = get(userAtom);
  saveUser(user);
};

// Reset the activity when the user logs out
export const activityResetEffect = (get, set) => {
  const activity = get(activityAtom);
  const user = get(userAtom);

  if (activity !== "data" && !user) {
    set(activityAtom, "data");
  }
};

// Load a list of portal users when a user logs in
export const usersEffect = (get, set) => {
  const user = get(userAtom);
  const users = get(usersAtom);

  if (user?.clickupId && users.length === 0) {
    (async () => {
      const usersData = await getManagementJson(get, "/users");
      set(
        usersAtom,
        usersData.sort((a: any, b: any) => (a.fullName < b.fullName ? -1 : 1)),
      );
    })();
  }
};

// Load the task list
export const tasksEffect = (get, set) => {
  const activity = get(activityAtom);
  const issueFilterTags = get(issueFilterTagsAtom);

  if (activity === "issues" && issueFilterTags) {
    set(reloadTasksAtom);
  }
};

// Load an individual task when an issue is selected
export const taskEffect = (get, set) => {
  const activity = get(activityAtom);
  const issue = get(issueAtom);

  if (activity === "issues") {
    set(reloadTaskAtom);
  }
};

// Load possible task statuses when the application loads
export const taskStatusesEffect = (get, set) => {
  const user = get(userAtom);

  if (user) {
    (async () => {
      const statuses = await set(getStatusesAtom);
      set(taskStatusesAtom, statuses);
    })();
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

// Log filters for debugging
observe((get) => {
  console.log("filters", get(requestedFiltersAtom));
}, store);
