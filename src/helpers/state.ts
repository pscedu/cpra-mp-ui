import { atom, Atom } from "jotai";
import { jwtDecode } from "jwt-decode";
import { loadUser, saveUser } from "./auth";
import { CommentNode, exportTask, importTask } from "./clickup";
import { managementBaseUrl } from "./config";
import {
  datasetsAtom as datasetsHashAtom,
  filtersAtom as filtersHashAtom,
  hashAtom,
  initHashAtoms,
  setHashUpdateMode,
} from "./hash";
import { getStructure, Structure } from "./structure";
import { getJson, getNdJson } from "./utils";
import { NavigateFunction } from "react-router";
import { CatalogQueries } from "./catalog";

function dataAtom<T>(loadFn: () => Promise<T>, defaultValue: T | null = null) {
  const baseAtom = atom<T | null>(defaultValue);
  const derivedAtom = atom(
    (get) => get(baseAtom),
    async (get, set) => {
      const value = await loadFn();
      set(baseAtom, value);
    },
  );
  // Auto-load on mount
  derivedAtom.onMount = (setAtom) => {
    setAtom();
  };
  return derivedAtom;
}

// Data atoms
export const structureAtom: Atom<Structure | null> = dataAtom(getStructure);

// URL hash atoms
export const activityAtom = hashAtom("activity", "data");
export const issueAtom = hashAtom("issue", null);
export const datasetsAtom = datasetsHashAtom(structureAtom);
export const filtersAtom = filtersHashAtom(structureAtom);
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

export const reconcileDatasets = (
  { updateGeographies }: { updateGeographies: boolean } = {
    updateGeographies: false,
  },
) => {
  // This function will be called from useEffect hooks in components
  // that need to reconcile datasets when they change
  return { updateGeographies };
};

initHashAtoms(reconcileDatasets);

// Other atoms
export const tasksAtom = atom<any>(null);
export const taskAtom = atom<any>(null);

const userBaseAtom = atom(loadUser());
export const userAtom = atom(
  (get) => get(userBaseAtom),
  (get, set, newValue) => {
    set(userBaseAtom, newValue);
    saveUser(newValue);
  },
);
export const usersAtom = atom<any[]>([]);
export const avatarCacheKeyAtom = atom(new Date().getTime());

export const catalogQueriesAtom: Atom<CatalogQueries | null> = atom(null);
export const timeValuesAtom = atom<any[]>([]);
export const timeValuesTimeoutAtom = atom<number | null>(null);

export const mapFeatureValuesAtom = atom({});
export const mapFeatureValuesAbortControllerAtom = atom<AbortController | null>(
  null,
);
export const mapFeatureValuesLoadingAtom = atom(false);
export const mapTilesLoadingAtom = atom(false);

export const visualizationTypeAtom = hashAtom(
  "visualization",
  "time-series-line",
);
export const analysisTypeAtom = hashAtom("analysis", "single");

export const issueFilterTagsAtom = atom<any[]>([]);
export const taskStatusesAtom = atom<any>(null);
export const contextMenuAtom = atom<any>(null);
export const workerPageAtom = atom({
  description: "",
  heading: "",
  status: "working",
});

// Query the catalog API for each selected dataset when the selected
// datasets or dimension values change.
export const queryCatalogAtom = atom(null, async (get, set) => {
  const datasetsValue = get(datasetsAtom);
  const filtersValue = get(filtersAtom);
  const structureValue = get(structureAtom);

  const cqs = new CatalogQueries(datasetsValue, filtersValue, structureValue);
  await cqs.executeAll();
  setHashUpdateMode("replace");
  set(catalogQueriesAtom, cqs);
  set(filtersAtom, cqs.combinedFilters);
  setHashUpdateMode("push");
});

export const mapCatalogQueryAtom = atom((get) => {
  const cqs = get(catalogQueriesAtom);
  if (!cqs) return null;
  // TODO: Allow user to select the active query/dataset.
  return cqs.queries[0];
});

export const mapDataUrlAtom = atom((get) => {
  const mapCq = get(mapCatalogQueryAtom);
  const analysisValue = get(analysisAtom);
  if (!mapCq || mapCq.dataset.grid.grid_type === "raster") return null;
  return mapCq.dataset.getDataUrl(
    mapCq.getQueryParams({ analysis: analysisValue }),
    "ndjson",
  );
});

export const mapTileUrlAtom = atom((get) => {
  const mapCq = get(mapCatalogQueryAtom);
  const analysisValue = get(analysisAtom);
  return mapCq
    ? mapCq.dataset.getTileUrl(
        mapCq.getQueryParams({
          analysis: analysisValue,
        }),
      )
    : null;
});

export const projectsModelGroupAtom = atom((get) => {
  const mapCq = get(mapCatalogQueryAtom);
  return (mapCq?.response?.results?.model_group_id || [-1])[0];
});

export const tagOptionsAtom = atom((get) => {
  const structureValue = get(structureAtom);
  const options = [];
  if (structureValue) {
    for (let dimension of structureValue.dimensions) {
      if (dimension.values) {
        options.push(
          ...dimension.values.map((dv) => ({
            value: `${dimension.name}:${dv.value}`,
            label: `${dimension.label}: ${dv.label || dv.value}`,
          })),
        );
      }
    }
  }
  return options;
});

export const timeDimensionAtom = atom((get) => {
  const cqs = get(catalogQueriesAtom);
  return cqs
    ? cqs.activeDimensions.filter((dim) => dim.filterType === "time")[0]
    : null;
});

export const timeChoicesAtom = atom((get) => {
  const timeDim = get(timeDimensionAtom);
  const cqs = get(catalogQueriesAtom);
  return timeDim && cqs ? cqs.combinedChoices[timeDim.name] || [] : [];
});

export const analysisAtom = atom((get) => {
  const analysisTypeValue = get(analysisTypeAtom);
  const [operation, dimension] = analysisTypeValue.split(":");
  return { operation, dimension };
});

export const visualizationSpecUrlAtom = atom((get) => {
  const structureValue = get(structureAtom);
  const mapCq = get(mapCatalogQueryAtom);
  const visualizationTypeValue = get(visualizationTypeAtom);
  const selectedGeographiesValue = get(selectedGeographiesAtom);
  const analysisValue = get(analysisAtom);

  return structureValue &&
    mapCq &&
    visualizationTypeValue &&
    selectedGeographiesValue &&
    selectedGeographiesValue.length
    ? structureValue.visualizationsMap[visualizationTypeValue].getSpecUrl(
        mapCq,
        {
          analysis: analysisValue,
          geographies: selectedGeographiesValue,
        },
      )
    : null;
});

export const projectsYearAtom = atom((get) => {
  const cqs = get(catalogQueriesAtom);
  const { combinedFilters } = cqs || {};
  if (combinedFilters) {
    if (combinedFilters.calendar_day)
      return parseInt(combinedFilters.calendar_day[0].substr(0, 4));
    if (combinedFilters.calendar_year) return combinedFilters.calendar_year[0];
  }
  return 0;
});

export const visualizationAtom = atom((get) => {
  const structureValue = get(structureAtom);
  const visualizationTypeValue = get(visualizationTypeAtom);
  return structureValue && visualizationTypeValue
    ? structureValue.visualizationsMap[visualizationTypeValue]
    : null;
});

export const rotateSelectedGeographiesAtom = atom(
  null,
  (get, set, offset: number) => {
    if (offset != 0) {
      const current = get(selectedGeographiesAtom);
      set(selectedGeographiesAtom, [
        ...current.slice(offset),
        ...current.slice(0, offset),
      ]);
    }
  },
);

export const setTimeValuesAtom = atom(null, (get, set, values) => {
  set(timeValuesAtom, values);
  const currentTimeout = get(timeValuesTimeoutAtom);
  if (currentTimeout) clearTimeout(currentTimeout);
  const timeDim = get(timeDimensionAtom);
  const newTimeout = setTimeout(() => {
    const filtersValue = get(filtersAtom);
    set(filtersAtom, {
      ...filtersValue,
      [timeDim.name]: values,
    });
  }, 250) as unknown as number;
  set(timeValuesTimeoutAtom, newTimeout);
});

export const setSelectedDatasetsAtom = atom(
  null,
  (get, set, selected: any[]) => {
    set(datasetsAtom, selected);
    // reconcileDatasets logic would be handled in a useEffect
  },
);

export const setSelectedFilterChoicesAtom = atom(
  null,
  (
    get,
    set,
    { dimensionName, values }: { dimensionName: string; values: any[] },
  ) => {
    const filtersValue = get(filtersAtom);
    set(filtersAtom, {
      ...filtersValue,
      [dimensionName]: values,
    });
  },
);

const getManagementJson = async (
  relativeUrl: string,
  { accessToken = null, body = null, method = "GET", tryRefresh = true } = {},
  getCurrentUser: () => any,
  setUser: (user: any) => void,
  refreshAccessTokenFn: () => Promise<boolean>,
) => {
  const currentUser = getCurrentUser();
  const res = await getJson(`${managementBaseUrl}${relativeUrl}`, {
    body,
    headers: {
      authorization: `Bearer ${
        accessToken ? accessToken : currentUser?.accessToken
      }`,
      "content-type": "application/json",
    },
    method,
  });
  if (res.error && res.error.status === 401) {
    // Try to obtain a new access token using the refresh token.
    if (tryRefresh && (await refreshAccessTokenFn()))
      return await getManagementJson(
        relativeUrl,
        {
          accessToken,
          body,
          method,
          tryRefresh,
        },
        getCurrentUser,
        setUser,
        refreshAccessTokenFn,
      );
    setUser(null);
  }
  return res;
};

const refreshAccessTokenFn = async (
  getCurrentUser: () => any,
  setUser: (user: any) => void,
) => {
  const currentUser = getCurrentUser();
  const refreshToken = currentUser?.refreshToken;
  if (!refreshToken) return false;
  const data = await getManagementJson(
    "/login/refresh",
    {
      accessToken: refreshToken,
      tryRefresh: false,
    },
    getCurrentUser,
    setUser,
    async () => false,
  );
  if (data.error) return false;
  setUser({ ...currentUser, accessToken: data.accessToken });
  return true;
};

export const getUserInfoFn = async (
  settings = {},
  getCurrentUser: () => any,
  setUser: (user: any) => void,
  refreshAccessTokenFn: () => Promise<boolean>,
) =>
  await getManagementJson(
    "/users/current_user",
    settings,
    getCurrentUser,
    setUser,
    refreshAccessTokenFn,
  );

export const getTasksFn = async (
  { tags } = {} as { tags?: any[] },
  getCurrentUser: () => any,
  setUser: (user: any) => void,
  refreshAccessTokenFn: () => Promise<boolean>,
) => {
  const params = new URLSearchParams();
  if (tags) for (const tag of tags) params.append("tags", tag.value);
  return await getManagementJson(
    `/tasks?${params}`,
    {},
    getCurrentUser,
    setUser,
    refreshAccessTokenFn,
  );
};

export const getTaskFn = async (
  taskId: string,
  getComments: boolean = false,
  getCurrentUser: () => any,
  setUser: (user: any) => void,
  refreshAccessTokenFn: () => Promise<boolean>,
) => {
  return await getManagementJson(
    `/tasks/${taskId}?getComments=${getComments.toString()}`,
    {},
    getCurrentUser,
    setUser,
    refreshAccessTokenFn,
  );
};

export const createTaskFn = async (
  taskData: any,
  getCurrentUser: () => any,
  setUser: (user: any) => void,
  refreshAccessTokenFn: () => Promise<boolean>,
) => {
  return await getManagementJson(
    "/tasks",
    {
      body: exportTask(taskData),
      method: "POST",
    },
    getCurrentUser,
    setUser,
    refreshAccessTokenFn,
  );
};

export const createCommentFn = async (
  taskId: string,
  comment: { assignee?: any; comment: CommentNode | CommentNode[] },
  getCurrentUser: () => any,
  setUser: (user: any) => void,
  refreshAccessTokenFn: () => Promise<boolean>,
) => {
  return await getManagementJson(
    `/tasks/${taskId}/comments`,
    {
      body: comment,
      method: "POST",
    },
    getCurrentUser,
    setUser,
    refreshAccessTokenFn,
  );
};

export const getStatusesFn = async (
  getCurrentUser: () => any,
  setUser: (user: any) => void,
  refreshAccessTokenFn: () => Promise<boolean>,
) =>
  await getManagementJson(
    "/statuses",
    {},
    getCurrentUser,
    setUser,
    refreshAccessTokenFn,
  );

export const reloadTaskAtom = atom(null, async (get, set) => {
  const issueValue = get(issueAtom);
  const getCurrentUser = () => get(userAtom);
  const setUser = (newUser: any) => set(userAtom, newUser);
  const refreshToken = async () =>
    await refreshAccessTokenFn(getCurrentUser, setUser);

  set(taskAtom, null);
  if (issueValue === "new")
    set(taskAtom, {
      assignees: [],
      tags: [],
      markdown_description: "",
      name: "",
    });
  else if (issueValue) {
    const taskData = await getTaskFn(
      issueValue,
      true,
      getCurrentUser,
      setUser,
      refreshToken,
    );
    set(taskAtom, importTask(taskData));
  }
});

export const reloadTasksAtom = atom(null, async (get, set) => {
  const issueFilterTagsValue = get(issueFilterTagsAtom);
  const getCurrentUser = () => get(userAtom);
  const setUser = (newUser: any) => set(userAtom, newUser);
  const refreshToken = async () =>
    await refreshAccessTokenFn(getCurrentUser, setUser);

  set(tasksAtom, null);
  const tasksData = await getTasksFn(
    { tags: issueFilterTagsValue },
    getCurrentUser,
    setUser,
    refreshToken,
  );
  set(tasksAtom, tasksData.map(importTask));
});

export const updateCommentAtom = atom(
  null,
  async (
    get,
    set,
    { commentId, commentUpdates }: { commentId: string; commentUpdates: any },
  ) => {
    const getCurrentUser = () => get(userAtom);
    const setUser = (newUser: any) => set(userAtom, newUser);
    const refreshToken = async () =>
      await refreshAccessTokenFn(getCurrentUser, setUser);

    return await getManagementJson(
      `/comments/${commentId}`,
      {
        body: commentUpdates,
        method: "PUT",
      },
      getCurrentUser,
      setUser,
      refreshToken,
    );
  },
);

export const updateTaskAtom = atom(null, async (get, set, taskUpdates: any) => {
  const taskValue = get(taskAtom);
  const getCurrentUser = () => get(userAtom);
  const setUser = (newUser: any) => set(userAtom, newUser);
  const refreshToken = async () =>
    await refreshAccessTokenFn(getCurrentUser, setUser);

  return await getManagementJson(
    `/tasks/${taskValue.id}`,
    {
      body: exportTask(taskUpdates),
      method: "PUT",
    },
    getCurrentUser,
    setUser,
    refreshToken,
  );
});

export const completeLoginAtom = atom(
  null,
  async (get, set, { search }, navigate: NavigateFunction) => {
    const query = new URLSearchParams(search);
    const loginError = (description: string) => {
      set(workerPageAtom, {
        description,
        heading: "Login error",
        status: "error",
      });
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

    const getCurrentUser = () => get(userAtom);
    const setUser = (newUser: any) => set(userAtom, newUser);
    const refreshTokenFn = async () =>
      await refreshAccessTokenFn(getCurrentUser, setUser);

    const currentUser = await getUserInfoFn(
      {
        accessToken: accessToken,
      },
      getCurrentUser,
      setUser,
      refreshTokenFn,
    );

    if (currentUser.error) return loginError("Failed to get user information");

    set(userAtom, {
      ...currentUser,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });

    navigate("/");
  },
);

export const linkClickupAtom = atom(
  null,
  (get, set, { search }: { search: string }, navigate: NavigateFunction) => {
    const query = new URLSearchParams(search);
    const currentUser = get(userAtom);
    if (query.get("status") === "success") {
      set(userAtom, {
        ...currentUser,
        clickupId: query.get("clickup_id"),
      });
    } else {
      // TODO: Add error handling for failed link operation.
    }
    navigate("/");
  },
);
