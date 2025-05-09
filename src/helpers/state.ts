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
import { filterTaskTags } from "./clickup";
import { dataBaseUrl, managementBaseUrl } from "./config";
import { datasetsSignal, filtersSignal, hashSignal } from "./hash";
import { Dataset, Dimension, getStructure } from "./structure";
import {
  extractCatalogObject,
  getJson,
  getNdJson,
  getFilterParams,
  makeQueryString,
  mergeOr,
} from "./utils";
import { NavigateFunction } from "react-router";

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
  const structure = dataSignal(getStructure);
  const activity = hashSignal("activity", "data");
  const issue = hashSignal("issue", null);

  const tasks = signal(null);
  const task = signal(null);

  const user = signal(loadUser());
  const users = signal([]);
  const avatarCacheKey = signal(new Date().getTime());

  const datasets = datasetsSignal(structure);
  const filters = filtersSignal(structure);
  const filterChoices = signal({});
  const catalogResponses = signal([]);
  const timeValues = signal([]);
  let timeValuesTimeout: number | null = null;

  const mapFeatureValues = signal({});
  let mapFeatureValuesAbortController: AbortController | null = null;
  const mapFeatureValuesLoading = signal(false);
  const mapTilesLoading = signal(false);

  const selectedGeographies = hashSignal(
    "geography",
    [],
    (values) => values.map((value) => value.toString()).join(","),
    (str) => str.split(",").map((valueStr) => parseInt(valueStr)),
  );
  const visualizationType = hashSignal("visualization", "time-series-line");
  const visualizationSpec = signal(null);

  const issueFilterTags = signal([]);

  // Query the catalog API for each selected dataset when the selected
  // datasets or dimension values change.
  const queryCatalog = (requestedFilters) => {
    (async () => {
      if (datasets.value && datasets.value.length && structure.value) {
        const responses = await Promise.all(
          datasets.value.map((dataset) => {
            const requiredDimensions = structure.value.getRequiredDimensions([
              dataset,
            ]);

            // Create a copy of the filters specific to this dataset so we can make
            // changes without impacting other datasets.
            const queryFilers = { ...requestedFilters };

            // Handle changing from daily/monthly datasets to annual/decadal datasets
            // and vice-versa.
            if (
              "calendar_day" in queryFilers &&
              ["annual", "decadal"].includes(dataset.time_unit)
            ) {
              queryFilers["calendar_year"] = queryFilers["calendar_day"].map(
                (dateStr) => {
                  let year = parseInt(dateStr.substr(0, 4));
                  if (dataset.time_unit === "decadal")
                    year = Math.round(year / 10) * 10;
                  return year;
                },
              );
              delete queryFilers["calendar_day"];
            } else if (
              "calendar_year" in queryFilers &&
              ["daily", "monthly"].includes(dataset.time_unit)
            ) {
              queryFilers["calendar_day"] = queryFilers["calendar_year"].map(
                (year) => `${year}-01-01`,
              );
              delete queryFilers["calendar_year"];
            }

            const qs = makeQueryString(
              getFilterParams(requiredDimensions, queryFilers),
            );
            const requestPath = `${dataBaseUrl}/datasets/${dataset.variable.name}/${dataset.grid.name}/${dataset.time_unit}/catalog.json${qs}`;
            return getJson(requestPath);
          }),
        );

        const newFilters = mergeOr(
          responses.map((response, i) =>
            extractCatalogObject(response.results, datasets.value[i]),
          ),
          filterDimensionNames.value,
        );

        const choices = mergeOr(
          responses.map((response, i) =>
            extractCatalogObject(response.choices, datasets.value[i]),
          ),
          filterDimensionNames.value,
        );

        batch(() => {
          filters.value = newFilters;
          filterChoices.value = choices;
          catalogResponses.value = responses;
          const timeDim = timeDimension.peek();
          if (timeDim) timeValues.value = newFilters[timeDim.name];
        });
      }
    })();
  };

  // Ensure there is always at least one dataset selected.
  effect(() => {
    if (structure.value) {
      untracked(() => {
        if (datasets.peek().length == 0)
          datasets.value = [structure.value.datasets[0]];
        queryCatalog(filters.peek());
      });
    }
  });

  // Dimensions representing a filter (not dataset or metadata).
  const filterDimensions = computed(() =>
    structure.value
      ? structure.value.dimensions.filter(
          (dimension) => !["dataset", "metadata"].includes(dimension.type),
        )
      : [],
  );

  // Names of filter dimensions.
  const filterDimensionNames = computed(() =>
    filterDimensions.value.map((dimension) => dimension.name),
  );

  // Partition and non-partition Dimensions for the selected datasets.
  const activeFilterDimensions = computed((): Dimension<any>[] =>
    structure.value && filterChoices.value
      ? structure.value.dimensions.filter(
          (dimension) => dimension.name in filterChoices.value,
        )
      : [],
  );

  // Select item dimensions.
  const activeSelectDimensions = computed((): Dimension<any>[] =>
    activeFilterDimensions.value.filter(
      (dimension) => !dimension.name.startsWith("calendar_"),
    ),
  );

  // Time dimensions.
  const activeTimeDimensions = computed((): Dimension<any>[] =>
    activeFilterDimensions.value.filter((dimension) =>
      dimension.name.startsWith("calendar_"),
    ),
  );

  const mapDataset = computed(() => {
    if (!datasets.value || !datasets.value.length) return null;
    // TODO: Allow user to select the active dataset.
    return datasets.value[0];
  });

  const mapDataUrl = computed(() => {
    if (
      !mapDataset.value ||
      !mapFilterParams.value ||
      mapDataset.value.grid.grid_type === "raster"
    )
      return null;
    return mapDataset.value.getDataUrl(mapFilterParams.value, "ndjson");
  });

  const mapCatalogResponse = computed(() => {
    if (!catalogResponses.value.length) return null;
    // TODO: Allow user to select the active dataset.
    return catalogResponses.value[0];
  });

  const mapFilterParams = computed(() => {
    const ds = mapDataset.value;
    const cr = mapCatalogResponse.value;
    if (!ds || !cr || !structure.value) return null;

    const requiredDimensions = structure.value.getRequiredDimensions([ds]);

    // TODO: Select the filters based on user input. For now, we select the first
    // value for each dimension.
    const selectedFilters = {};
    for (let dimension of requiredDimensions)
      selectedFilters[dimension.name] = [cr.results[dimension.name][0]];

    return getFilterParams(requiredDimensions, selectedFilters);
  });

  const visualizationFilterParams = computed(() =>
    mapFilterParams.value && selectedGeographies.value.length > 0
      ? mapFilterParams.value
          .filter(([param, _value]) => !param.startsWith("calendar_"))
          .concat([["geography", selectedGeographies.value]])
      : null,
  );

  const mapTileUrl = computed(() =>
    mapDataset.value && mapFilterParams.value
      ? mapDataset.value.getTileUrl(mapFilterParams.value)
      : null,
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
    activeTimeDimensions.value.length ? activeTimeDimensions.value[0] : null,
  );

  const timeChoices = computed(() =>
    timeDimension.value
      ? (filterChoices.value || {})[timeDimension.value.name] || []
      : [],
  );

  const visualizationSpecUrl = computed(() => {
    return visualizationFilterParams.value && visualizationType.value
      ? mapDataset.value.getVisualizationUrl(
          visualizationFilterParams.value,
          visualizationType.value,
        )
      : null;
  });

  const setTimeValues = (values) => {
    timeValues.value = values;
    if (timeValuesTimeout) clearTimeout(timeValuesTimeout);
    timeValuesTimeout = setTimeout(
      () =>
        queryCatalog({
          ...filters.value,
          [timeDimension.value.name]: values,
        }),
      250,
    );
  };

  const setSelectedDatasets = (selected: Dataset[]) => {
    batch(() => {
      datasets.value = selected;
      catalogResponses.value = [];
    });
    queryCatalog(filters.value);
  };

  const setSelectedFilterChoices = (dimensionName: string, values: []) => {
    queryCatalog({
      ...filters.value,
      [dimensionName]: values,
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
    return await getManagementJson("/tasks", { body: task, method: "POST" });
  };

  const createComment = async (taskId: string, commentText: string) => {
    return await getManagementJson(`/tasks/${taskId}/comments`, {
      body: { commentText },
      method: "POST",
    });
  };

  const reloadTask = () => {
    task.value = null;
    (async () => {
      if (issue.value === "new")
        task.value = {
          assignees: [],
          tags: [],
          description: "",
          name: "",
          saveUrl: true,
        };
      else if (issue.value)
        task.value = filterTaskTags(await getTask(issue.value, true));
    })();
  };

  const reloadTasks = () => {
    tasks.value = null;
    (async () => {
      tasks.value = (await getTasks({ tags: issueFilterTags.value })).map(
        filterTaskTags,
      );
    })();
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

  // Load the visualization spec when the URL changes.
  effect(() => {
    (async () =>
      (visualizationSpec.value = visualizationSpecUrl.value
        ? await getJson(visualizationSpecUrl.value)
        : null))();
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

  return {
    activeSelectDimensions,
    activity,
    avatarCacheKey,
    completeLogin,
    createComment,
    createTask,
    datasets,
    filters,
    filterChoices,
    getTask,
    getTasks,
    issue,
    issueFilterTags,
    linkClickup,
    mapDataset,
    mapFeatureValues,
    mapFeatureValuesLoading,
    mapTileUrl,
    mapTilesLoading,
    reloadTask,
    reloadTasks,
    selectedGeographies,
    setSelectedDatasets,
    setSelectedFilterChoices,
    setTimeValues,
    structure,
    tagOptions,
    task,
    tasks,
    timeChoices,
    timeDimension,
    timeValues,
    user,
    users,
    visualizationSpec,
  };
}

export const usePortalState = () => useContext(PortalState);
