import { createContext, useContext } from "react";
import {
  batch,
  computed,
  effect,
  Signal,
  signal,
  untracked,
} from "@preact/signals-react";
import { jwtDecode } from "jwt-decode";
import { loadUser, saveUser } from "./auth";
import { CommentNode, exportTask, importTask } from "./clickup";
import { managementBaseUrl } from "./config";
import {
  datasetsSignal,
  filtersSignal,
  hashSignal,
  initHashSignals,
  setHashUpdateMode,
} from "./hash";
import { Dataset, getStructure, Structure } from "./structure";
import { getJson, getNdJson, sortConsistent } from "./utils";
import { NavigateFunction } from "react-router";
import { CatalogQueries } from "./catalog";

export const PortalState = createContext(null);

function dataSignal(loadFn: Function, defaultValue = null) {
  const sig = signal(defaultValue);
  effect(() => {
    (async () => {
      sig.value = await loadFn();
    })();
  });
  return sig;
}

export function createPortalState() {
  // Data signals
  const structure: Signal<Structure | null> = dataSignal(getStructure);

  // URL hash isgnals
  const activity = hashSignal("activity", "data");
  const issue = hashSignal("issue", null);
  const datasets = datasetsSignal(structure);
  const filters = filtersSignal(structure);
  const mapPosition = hashSignal(
    "map",
    [8, 29.75, -91.5],
    (values) => values.map((value) => value.toFixed(2)).join("/"),
    (valueStr) => valueStr.split("/").map((value) => parseFloat(value)),
    true,
  );
  const selectedGeographies = hashSignal<number[] | number[][]>(
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
  const showGridLabels = hashSignal(
    "show_grid_labels",
    false,
    (value) => (value ? "true" : "false"),
    (value) => value === "true",
  );
  const showGridLines = hashSignal(
    "show_grid_lines",
    true,
    (value) => (value ? "true" : "false"),
    (value) => value === "true",
  );
  const showProjects = hashSignal(
    "show_projects",
    true,
    (value) => (value ? "true" : "false"),
    (value) => value !== "false",
  );
  const showWater = hashSignal(
    "show_water",
    false,
    (value) => (value ? "true" : "false"),
    (value) => value !== "false",
  );
  const startDate = hashSignal("start_date", null);
  const endDate = hashSignal("end_date", null);
  const reconcileState = (
    { updateGeographies }: { updateGeographies: boolean } = {
      updateGeographies: false,
    },
  ) => {
    if (!datasets.value.length) return;
    // TODO: Allow the user to select the map dataset.
    const mapDataset = datasets.value[0];

    // Reset selected geographies when the grid changes.
    if (
      updateGeographies &&
      mapCatalogQuery.value &&
      mapCatalogQuery.value.dataset.grid !== mapDataset.grid
    )
      selectedGeographies.value = [];

    // Handle changing from daily/monthly datasets to annual/decadal datasets
    // and vice-versa.
    const timeColumn = mapDataset.getTimeColumn();
    const newFilters = { ...filters.value };
    if ("calendar_day" in filters.value && timeColumn === "calendar_year") {
      newFilters["calendar_year"] = filters.value["calendar_day"].map(
        (dateStr) => {
          let year = parseInt(dateStr.substr(0, 4));
          if (mapDataset.time_unit === "decadal")
            year = Math.round(year / 10) * 10;
          return year;
        },
      );
      delete newFilters["calendar_day"];
      filters.value = newFilters;
      if (analysis.value.dimension === "calendar_day")
        analysisType.value = `${analysis.value.operation}:calendar_year`;
    } else if (
      "calendar_year" in filters.value &&
      timeColumn === "calendar_day"
    ) {
      newFilters["calendar_day"] = filters.value["calendar_year"].map(
        (year) => `${year}-01-01`,
      );
      delete newFilters["calendar_year"];
      filters.value = newFilters;
      if (analysis.value.dimension === "calendar_year")
        analysisType.value = `${analysis.value.operation}:calendar_day`;
    }
  };

  initHashSignals(reconcileState);

  // Other signals
  const tasks = signal(null);
  const task = signal(null);

  const user = signal(loadUser());
  const users = signal([]);
  const avatarCacheKey = signal(new Date().getTime());

  const catalogQueries: Signal<CatalogQueries | null> = signal(null);
  const timeValues = signal([]);
  let timeValuesTimeout: number | null = null;

  const mapFeatureValues = signal({});
  let mapFeatureValuesAbortController: AbortController | null = null;
  const mapFeatureValuesLoading = signal(false);
  const mapTilesLoading = signal(false);

  const visualizationType = hashSignal("visualization", "time-series-line");
  const analysisType = hashSignal("analysis", "single");

  const issueFilterTags = signal([]);
  const taskStatuses = signal(null);
  const contextMenu = signal(null);

  // Query the catalog API for each selected dataset when the selected
  // datasets or dimension values change.
  const queryCatalog = () => {
    (async () => {
      const cqs = new CatalogQueries(
        datasets.value,
        filters.value,
        structure.value,
      );
      await cqs.executeAll();
      setHashUpdateMode("replace");
      batch(() => {
        catalogQueries.value = cqs;
        filters.value = cqs.combinedFilters;
      });
      setHashUpdateMode("push");
    })();
  };

  // Ensure there is always at least one dataset selected.
  effect(() => {
    if (structure.value) {
      untracked(() => {
        if (datasets.peek().length == 0)
          datasets.value = [structure.value.datasets[0]];
      });
    }
  });

  // Query the catalog when datasets or filters change.
  effect(() => {
    if (!structure.value) return;
    if (
      !catalogQueries.value ||
      datasets.value !== catalogQueries.value.datasets ||
      filters.value !== catalogQueries.value.combinedFilters
    )
      return queryCatalog();
  });

  const mapCatalogQuery = computed(() => {
    if (!catalogQueries.value) return null;
    // TODO: Allow user to select the active query/dataset.
    return catalogQueries.value.queries[0];
  });

  const mapDataUrl = computed(() => {
    if (
      !mapCatalogQuery.value ||
      mapCatalogQuery.value.dataset.grid.grid_type === "raster"
    )
      return null;
    return mapCatalogQuery.value.dataset.getDataUrl(
      mapCatalogQuery.value.getQueryParams({
        analysis: analysis.value,
        maxValues: 1,
      }),
      "ndjson",
    );
  });

  const mapTileUrl = computed(() =>
    mapCatalogQuery.value
      ? mapCatalogQuery.value.dataset.getTileUrl(
          mapCatalogQuery.value.getQueryParams({
            analysis: analysis.value,
            maxValues: 1,
          }),
        )
      : null,
  );

  const projectsModelGroup = computed(
    () => (mapCatalogQuery.value?.response?.results?.model_group_id || [-1])[0],
  );

  const tagOptions = computed(() => {
    const options = [];
    if (structure.value) {
      for (let dimension of structure.value.dimensions) {
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

  const timeDimension = computed(() =>
    catalogQueries.value
      ? catalogQueries.value.activeDimensions.filter(
          (dim) => dim.filterType === "time",
        )[0]
      : null,
  );

  const timeChoices = computed(() =>
    timeDimension.value && catalogQueries.value
      ? catalogQueries.value.combinedChoices[timeDimension.value.name] || []
      : [],
  );

  const analysis = computed(() => {
    const [operation, dimension] = analysisType.value.split(":");
    return { operation, dimension };
  });

  const visualizationSpecUrl = computed(() => {
    return structure.value &&
      mapCatalogQuery.value &&
      visualizationType.value &&
      selectedGeographies.value &&
      selectedGeographies.value.length
      ? structure.value.visualizationsMap[visualizationType.value].getSpecUrl(
          mapCatalogQuery.value,
          {
            analysis: analysis.value.dimension?.startsWith("calendar_")
              ? null
              : analysis.value,
            geographies: selectedGeographies.value,
          },
        )
      : null;
  });

  const projectsYear = computed(() => {
    const { combinedFilters } = catalogQueries.value || {};
    if (combinedFilters) {
      if (combinedFilters.calendar_day)
        return parseInt(combinedFilters.calendar_day[0].substr(0, 4));
      if (combinedFilters.calendar_year)
        return combinedFilters.calendar_year[0];
    }
    return 0;
  });

  const visualization = computed(() =>
    structure.value && visualizationType.value
      ? structure.value.visualizationsMap[visualizationType.value]
      : null,
  );

  const rotateSelectedGeographies = (offset: number) => {
    if (offset != 0)
      selectedGeographies.value = [
        ...selectedGeographies.value.slice(offset),
        ...selectedGeographies.value.slice(0, offset),
      ];
  };

  const setTimeValues = (values) => {
    timeValues.value = values;
    if (timeValuesTimeout) clearTimeout(timeValuesTimeout);
    timeValuesTimeout = setTimeout(
      () => setSelectedFilterChoices(timeDimension.value.name, values),
      250,
    );
  };

  const setSelectedDatasets = (selected: Dataset[]) => {
    batch(() => {
      datasets.value = selected;
      reconcileState({ updateGeographies: true });
    });
  };

  const setSelectedFilterChoices = (
    dimensionName: string,
    values: [],
    sort = true,
  ) => {
    if (sort) sortConsistent(values, filters.value[dimensionName]);
    filters.value = {
      ...filters.value,
      [dimensionName]: values,
    };
  };

  const setAnalysis = (operation: string, dimension: string) => {
    batch(() => {
      analysisType.value = dimension ? `${operation}:${dimension}` : operation;
    });
  };

  const getManagementJson = async (
    relativeUrl: string,
    { accessToken = null, body = null, method = "GET", tryRefresh = true } = {},
  ) => {
    const res = await getJson(`${managementBaseUrl}${relativeUrl}`, {
      body,
      headers: {
        authorization: `Bearer ${
          accessToken ? accessToken : user.peek().accessToken
        }`,
        "content-type": "application/json",
      },
      method,
    });
    if (res.error && res.error.status === 401) {
      // Try to obtain a new access token using the refresh token.
      if (tryRefresh && (await refreshAccessToken()))
        return await getManagementJson(relativeUrl, {
          accessToken,
          body,
          method,
          tryRefresh,
        });
      user.value = null;
    }
    return res;
  };

  const refreshAccessToken = async () => {
    const refreshToken = user.peek()?.refreshToken;
    if (!refreshToken) return false;
    const data = await getManagementJson("/login/refresh", {
      accessToken: refreshToken,
      tryRefresh: false,
    });
    if (data.error) return false;
    user.value = { ...user.value, accessToken: data.accessToken };
    return true;
  };

  const getUserInfo = async (settings = {}) =>
    await getManagementJson("/users/current_user", settings);

  const getTasks = async ({ tags } = {}) => {
    const params = new URLSearchParams();
    if (tags) for (const tag of tags) params.append("tags", tag.value);
    return await getManagementJson(`/tasks?${params}`);
  };

  const getTask = async (taskId: string, getComments: boolean = false) => {
    return await getManagementJson(
      `/tasks/${taskId}?getComments=${getComments.toString()}`,
    );
  };

  const createTask = async (task: any) => {
    return await getManagementJson("/tasks", {
      body: exportTask(task),
      method: "POST",
    });
  };

  const createComment = async (
    taskId: string,
    comment: { assignee?: any; comment: CommentNode | CommentNode[] },
  ) => {
    return await getManagementJson(`/tasks/${taskId}/comments`, {
      body: comment,
      method: "POST",
    });
  };

  const getStatuses = async () => await getManagementJson("/statuses");

  const reloadTask = () => {
    task.value = null;
    (async () => {
      if (issue.value === "new")
        task.value = {
          assignees: [],
          tags: [],
          markdown_description: "",
          name: "",
        };
      else if (issue.value)
        task.value = importTask(await getTask(issue.value, true));
    })();
  };

  const reloadTasks = () => {
    tasks.value = null;
    (async () => {
      tasks.value = (await getTasks({ tags: issueFilterTags.value })).map(
        importTask,
      );
    })();
  };

  const updateComment = async (commentId: string, commentUpdates: any) => {
    return await getManagementJson(`/comments/${commentId}`, {
      body: commentUpdates,
      method: "PUT",
    });
  };

  const updateTask = async (taskUpdates: any) => {
    return await getManagementJson(`/tasks/${task.value.id}`, {
      body: exportTask(taskUpdates),
      method: "PUT",
    });
  };

  const completeLogin = (
    { search }: Location,
    navigate: NavigateFunction,
    {
      description,
      heading,
      status,
    }: { description: Signal; heading: Signal; status: Signal },
  ) => {
    const query = new URLSearchParams(search);
    const loginError = (msg: string) => {
      batch(() => {
        description.value = msg;
        heading.value = "Login error";
        status.value = "error";
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

    (async () => {
      const currentUser = await getUserInfo({
        accessToken: accessToken,
      });

      if (currentUser.error)
        return loginError("Failed to get user information");

      user.value = {
        ...currentUser,
        accessToken: accessToken,
        refreshToken: refreshToken,
      };

      navigate("/");
    })();
  };

  const linkClickup = ({ search }: Location, navigate: NavigateFunction) => {
    const query = new URLSearchParams(search);
    if (query.get("status") === "success") {
      user.value = {
        ...user.value,
        clickupId: query.get("clickup_id"),
      };
    } else {
      // TODO: Add error handling for failed link operation.
    }
    navigate("/");
  };

  // Update time values when new catalog queries are performed.
  // TODO: The delay logic can probably be handled inside the time-select component.
  effect(() => {
    const cqs = catalogQueries.value;
    const timeDim = timeDimension.peek();
    if (cqs && timeDim) timeValues.value = cqs.combinedFilters[timeDim.name];
  });

  // Update map feature state when the dataset or filters change.
  effect(() => {
    (async () => {
      if (mapDataUrl.value) {
        if (mapFeatureValuesAbortController)
          mapFeatureValuesAbortController.abort("map state changed");
        mapFeatureValuesAbortController = new AbortController();

        mapFeatureValuesLoading.value = true;
        let data;
        try {
          data = await getNdJson(mapDataUrl.value, {
            signal: mapFeatureValuesAbortController.signal,
          });
        } catch (err) {
          if (err === "map state changed") return;
          throw err;
        }

        if (data.length === 1) {
          batch(() => {
            mapFeatureValues.value = data[0];
            mapFeatureValuesLoading.value = false;
          });
        } else {
          console.error(`Expected 1 row, received ${data.length}`, data);
        }
      } else {
        mapFeatureValues.value = {};
      }
    })();
  });

  // Reload user information when the application loads.
  // This also allows us to get a fresh ACCESS token, if necessary.
  effect(() => {
    if (user.peek())
      (async () => {
        const userInfo = await getUserInfo(user);
        user.value = userInfo.error ? null : { ...user.value, ...userInfo };
      })();
  });

  // Save user information to local storage when it changes.
  effect(() => {
    saveUser(user.value);
  });

  // Reset the activity when the user logs out.
  effect(() => {
    if (activity.value !== "data" && !user.value) activity.value = "data";
  });

  // Load a list of portal users when a user logs in.
  effect(() => {
    if (user.value?.clickupId && users.value.length === 0) {
      (async () =>
        (users.value = (await getManagementJson("/users")).sort((a, b) =>
          a.fullName < b.fullName ? -1 : 1,
        )))();
    }
  });

  // Load the task list.
  effect(() => {
    if (activity.value === "issues" && issueFilterTags.value) reloadTasks();
  });

  // Load an individual task when an issue is selected.
  effect(() => {
    if (activity.value === "issues") reloadTask();
  });

  // Load possible task statuses when the application loads.
  effect(() => {
    if (user.value) (async () => (taskStatuses.value = await getStatuses()))();
  });

  return {
    activity,
    analysis,
    avatarCacheKey,
    catalogQueries,
    completeLogin,
    contextMenu,
    createComment,
    createTask,
    datasets,
    endDate,
    filters,
    getTask,
    getTasks,
    issue,
    issueFilterTags,
    linkClickup,
    mapCatalogQuery,
    mapFeatureValues,
    mapFeatureValuesLoading,
    mapPosition,
    mapTileUrl,
    mapTilesLoading,
    projectsModelGroup,
    projectsYear,
    reloadTask,
    reloadTasks,
    rotateSelectedGeographies,
    selectedGeographies,
    setAnalysis,
    setSelectedDatasets,
    setSelectedFilterChoices,
    setTimeValues,
    showGridLabels,
    showGridLines,
    showProjects,
    showWater,
    startDate,
    structure,
    tagOptions,
    task,
    tasks,
    taskStatuses,
    timeChoices,
    timeDimension,
    timeValues,
    updateComment,
    updateTask,
    user,
    users,
    visualization,
    visualizationType,
    visualizationSpecUrl,
  };
}

export const usePortalState = () => useContext(PortalState);
