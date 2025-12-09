import { atom, createStore, WritableAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { jwtDecode } from "jwt-decode";
import { loadUser, saveUser } from "./auth";
import { CommentNode, exportTask, importTask } from "./clickup";
import { managementBaseUrl } from "./config";
import {
  datasetsAtom as createDatasetsAtom,
  filtersAtom as createFiltersAtom,
  hashAtom,
  setHashUpdateMode,
  hashSyncEffectAtom,
  hashWriteEffectAtom,
} from "./hash";
import { Dataset, getStructure } from "./structure";
import { getJson, getNdJson, sortConsistent } from "./utils";
import { NavigateFunction } from "react-router";
import { CatalogQueries } from "./catalog";

export const store = createStore();

// ============================================================================
// Data Loading Atoms
// ============================================================================

export const structureAtom = atom(async () => {
  return await getStructure();
});

// ============================================================================
// URL Hash Atoms
// ============================================================================

export const activityAtom = hashAtom("activity", "data");
export const issueAtom = hashAtom("issue", null);

// Create datasets and filters atoms that depend on structure
export const datasetsAtom = createDatasetsAtom(structureAtom);
export const filtersAtom = createFiltersAtom(structureAtom);

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

export const showGridLabelsAtom = hashAtom(
  "show_grid_labels",
  false,
  (value) => (value ? "true" : "false"),
  (value) => value === "true",
);

export const showGridLinesAtom = hashAtom(
  "show_grid_lines",
  true,
  (value) => (value ? "true" : "false"),
  (value) => value === "true",
);

export const showProjectsAtom = hashAtom(
  "show_projects",
  true,
  (value) => (value ? "true" : "false"),
  (value) => value !== "false",
);

export const showWaterAtom = hashAtom(
  "show_water",
  false,
  (value) => (value ? "true" : "false"),
  (value) => value !== "false",
);

export const startDateAtom = hashAtom("start_date", null);
export const endDateAtom = hashAtom("end_date", null);

export const visualizationTypeAtom = hashAtom(
  "visualization",
  "time-series-line",
);
export const analysisTypeAtom = hashAtom("analysis", "single");

// ============================================================================
// Other State Atoms
// ============================================================================

export const tasksAtom = atom(null as any);
export const taskAtom = atom(null as any);
export const userAtom = atom(loadUser() as any);
export const usersAtom = atom([] as any[]);
export const avatarCacheKeyAtom = atom(new Date().getTime());
export const catalogQueriesAtom = atom(null as CatalogQueries | null);
export const timeValuesAtom = atom([] as any[]);
export const mapFeatureValuesAtom = atom({} as any);
export const mapFeatureValuesLoadingAtom = atom(false);
export const mapTilesLoadingAtom = atom(false);
export const issueFilterTagsAtom = atom([] as any[]);
export const taskStatusesAtom = atom(null as any);
export const contextMenuAtom = atom(null as any);

// ============================================================================
// Reconcile State Atom
// ============================================================================

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

    // Reset selected geographies when the grid changes.
    if (
      updateGeographies &&
      mapCatalogQuery &&
      mapCatalogQuery.dataset.grid !== mapDataset.grid
    )
      set(selectedGeographiesAtom, []);

    // Reset analysis when the variable changes.
    if (
      analysis.operation === "concatenate" &&
      mapDataset?.variable?.name !== "lnd_type"
    )
      set(analysisTypeAtom, "single");

    // Handle changing from daily/monthly datasets to annual/decadal datasets
    // and vice-versa.
    const filters = get(filtersAtom);
    const timeColumn = mapDataset.getTimeColumn();
    const newFilters = { ...filters };
    if ("calendar_day" in filters && timeColumn === "calendar_year") {
      newFilters["calendar_year"] = filters["calendar_day"].map(
        (dateStr: string) => {
          let year = parseInt(dateStr.substr(0, 4));
          if (mapDataset.time_unit === "decadal")
            year = Math.round(year / 10) * 10;
          return year;
        },
      );
      delete newFilters["calendar_day"];
      set(filtersAtom, newFilters);
      if (analysis.dimension === "calendar_day")
        set(analysisTypeAtom, `${analysis.operation}:calendar_year`);
    } else if ("calendar_year" in filters && timeColumn === "calendar_day") {
      newFilters["calendar_day"] = filters["calendar_year"].map(
        (year: number) => `${year}-01-01`,
      );
      delete newFilters["calendar_year"];
      set(filtersAtom, newFilters);
      if (analysis.dimension === "calendar_year")
        set(analysisTypeAtom, `${analysis.operation}:calendar_day`);
    }
  },
);

// ============================================================================
// Derived Atoms
// ============================================================================

export const timeDimensionAtom = atom((get) => {
  const catalogQueries = get(catalogQueriesAtom);
  return catalogQueries
    ? catalogQueries.activeDimensions.filter(
        (dim: any) => dim.filterType === "time",
      )[0]
    : null;
});

export const timeChoicesAtom = atom((get) => {
  const timeDimension = get(timeDimensionAtom);
  const catalogQueries = get(catalogQueriesAtom);
  return timeDimension && catalogQueries
    ? catalogQueries.combinedChoices[timeDimension.name] || []
    : [];
});

export const analysisAtom = atom((get) => {
  const analysisType = get(analysisTypeAtom);
  const [operation, dimension] = analysisType.split(":");
  return { operation, dimension };
});

export const mapCatalogQueryAtom = atom((get) => {
  const catalogQueries = get(catalogQueriesAtom);
  if (!catalogQueries) return null;
  // TODO: Allow user to select the active query/dataset.
  return catalogQueries.queries[0];
});

export const mapDataUrlAtom = atom((get) => {
  const mapCatalogQuery = get(mapCatalogQueryAtom);
  const analysis = get(analysisAtom);

  if (!mapCatalogQuery || mapCatalogQuery.dataset.grid.grid_type === "raster")
    return null;
  return mapCatalogQuery.dataset.getDataUrl(
    mapCatalogQuery.getQueryParams({
      analysis: analysis,
      maxValues: 1,
    }),
    "ndjson",
  );
});

export const mapTileUrlAtom = atom((get) => {
  const mapCatalogQuery = get(mapCatalogQueryAtom);
  const analysis = get(analysisAtom);

  return mapCatalogQuery
    ? mapCatalogQuery.dataset.getTileUrl(
        mapCatalogQuery.getQueryParams({
          analysis: analysis,
          maxValues: 1,
        }),
      )
    : null;
});

export const projectsModelGroupAtom = atom((get) => {
  const mapCatalogQuery = get(mapCatalogQueryAtom);
  return (mapCatalogQuery?.response?.results?.model_group_id || [-1])[0];
});

export const tagOptionsAtom = atom(async (get) => {
  const structure = await get(structureAtom);
  const options = [];
  if (structure) {
    for (let dimension of structure.dimensions) {
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

export const visualizationSpecUrlAtom = atom(async (get) => {
  const structure = await get(structureAtom);
  const mapCatalogQuery = get(mapCatalogQueryAtom);
  const visualizationType = get(visualizationTypeAtom);
  const selectedGeographies = get(selectedGeographiesAtom);
  const analysis = get(analysisAtom);

  return structure &&
    mapCatalogQuery &&
    visualizationType &&
    selectedGeographies &&
    selectedGeographies.length
    ? structure.visualizationsMap[visualizationType].getSpecUrl(
        mapCatalogQuery,
        {
          analysis: analysis.dimension?.startsWith("calendar_")
            ? null
            : analysis,
          geographies: selectedGeographies,
        },
      )
    : null;
});

export const projectsYearAtom = atom((get) => {
  const catalogQueries = get(catalogQueriesAtom);
  const combinedFilters = catalogQueries?.combinedFilters;
  if (combinedFilters) {
    if (combinedFilters.calendar_day)
      return parseInt(combinedFilters.calendar_day[0].substr(0, 4));
    if (combinedFilters.calendar_year) return combinedFilters.calendar_year[0];
  }
  return 0;
});

export const visualizationAtom = atom(async (get) => {
  const structure = await get(structureAtom);
  const visualizationType = get(visualizationTypeAtom);
  return structure && visualizationType
    ? structure.visualizationsMap[visualizationType]
    : null;
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

let timeValuesTimeout: ReturnType<typeof setTimeout> | null = null;

export const setTimeValuesAtom = atom(
  null,
  (
    get,
    set,
    { values, useTimeout = true }: { values: any[]; useTimeout?: boolean },
  ) => {
    const timeDimension = get(timeDimensionAtom);
    set(timeValuesAtom, values);

    if (timeValuesTimeout) clearTimeout(timeValuesTimeout);

    const updateFilters = () => {
      set(setSelectedFilterChoicesAtom, {
        dimensionName: timeDimension.name,
        values,
        sort: true,
      });
    };

    if (useTimeout) {
      timeValuesTimeout = setTimeout(updateFilters, 250);
    } else {
      updateFilters();
    }
  },
);

export const setSelectedDatasetsAtom = atom(
  null,
  (get, set, selected: Dataset[]) => {
    set(datasetsAtom, selected);
    set(reconcileStateAtom, { updateGeographies: true });
  },
);

export const setSelectedFilterChoicesAtom = atom(
  null,
  (
    get,
    set,
    {
      dimensionName,
      values,
      sort = true,
    }: { dimensionName: string; values: any[]; sort?: boolean },
  ) => {
    const filters = get(filtersAtom);
    if (sort) sortConsistent(values, filters[dimensionName]);
    set(filtersAtom, {
      ...filters,
      [dimensionName]: values,
    });
  },
);

export const setAnalysisAtom = atom(
  null,
  (
    get,
    set,
    { operation, dimension }: { operation: string; dimension: string },
  ) => {
    set(analysisTypeAtom, dimension ? `${operation}:${dimension}` : operation);
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

// ============================================================================
// Effect Atoms
// ============================================================================

// Ensure there is always at least one dataset selected
export const ensureDatasetEffect = (get, set) => {
  const datasets = get(datasetsAtom);

  (async () => {
    const structure = await get(structureAtom);
    if (structure && datasets.length === 0) {
      set(datasetsAtom, [structure.datasets[0]]);
    }
  })();
};

// Query the catalog when datasets or filters change
export const catalogQueryEffect = (get, set) => {
  const datasets = get(datasetsAtom);
  const filters = get(filtersAtom);
  const catalogQueries = get(catalogQueriesAtom);

  (async () => {
    const structure = await get(structureAtom);
    if (!structure) return;

    if (
      !catalogQueries ||
      datasets !== catalogQueries.datasets ||
      filters !== catalogQueries.combinedFilters
    ) {
      const cqs = new CatalogQueries(datasets, filters, structure);
      await cqs.executeAll();
      setHashUpdateMode("replace");
      set(catalogQueriesAtom, cqs);
      set(filtersAtom, cqs.combinedFilters);
      setHashUpdateMode("push");
    }
  })();
};

// Update time values when catalog queries change
export const timeValuesEffect = (get, set) => {
  const catalogQueries = get(catalogQueriesAtom);
  const timeDimension = get(timeDimensionAtom);

  if (catalogQueries && timeDimension) {
    set(timeValuesAtom, catalogQueries.combinedFilters[timeDimension.name]);
  }
};

// Update map feature state when the dataset or filters change
let mapFeatureValuesAbortController: AbortController | null = null;

export const mapFeatureValuesEffect = (get, set) => {
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
};

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

// Initialize all effect atoms
export const initEffectsAtom = atomEffect((get, set) => {
  // hashSyncEffect(get, set);
  // hashWriteEffect(get, set);
  ensureDatasetEffect(get, set);
  catalogQueryEffect(get, set);
  timeValuesEffect(get, set);
  mapFeatureValuesEffect(get, set);
  userInfoEffect(get, set);
  userPersistenceEffect(get, set);
  activityResetEffect(get, set);
  usersEffect(get, set);
  tasksEffect(get, set);
  taskEffect(get, set);
  taskStatusesEffect(get, set);
});
