import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  activityAtom,
  catalogQueriesAtom,
  datasetsAtom,
  filtersAtom,
  structureAtom,
  queryCatalogAtom,
  mapDataUrlAtom,
  mapFeatureValuesAtom,
  mapFeatureValuesLoadingAtom,
  mapFeatureValuesAbortControllerAtom,
  userAtom,
  usersAtom,
  issueFilterTagsAtom,
  reloadTaskAtom,
  reloadTasksAtom,
  taskStatusesAtom,
  timeDimensionAtom,
  timeValuesAtom,
} from "./state";
import { getNdJson } from "./utils";

/**
 * Custom hook to handle side effects that were previously in signal effects.
 * This should be called once at the app root level.
 */
export function useStateEffects() {
  const structure = useAtomValue(structureAtom);
  const [datasets, setDatasets] = useAtom(datasetsAtom);
  const catalogQueries = useAtomValue(catalogQueriesAtom);
  const filters = useAtomValue(filtersAtom);
  const queryCatalog = useSetAtom(queryCatalogAtom);
  const activity = useAtomValue(activityAtom);
  const [user, setUser] = useAtom(userAtom);
  const users = useAtomValue(usersAtom);
  const issueFilterTags = useAtomValue(issueFilterTagsAtom);
  const reloadTask = useSetAtom(reloadTaskAtom);
  const reloadTasks = useSetAtom(reloadTasksAtom);
  const taskStatuses = useAtomValue(taskStatusesAtom);
  const mapDataUrl = useAtomValue(mapDataUrlAtom);
  const setMapFeatureValues = useSetAtom(mapFeatureValuesAtom);
  const setMapFeatureValuesLoading = useSetAtom(mapFeatureValuesLoadingAtom);
  const [mapFeatureValuesAbortController, setMapFeatureValuesAbortController] =
    useAtom(mapFeatureValuesAbortControllerAtom);
  const timeDimension = useAtomValue(timeDimensionAtom);
  const setTimeValues = useSetAtom(timeValuesAtom);

  // Ensure there is always at least one dataset selected.
  useEffect(() => {
    if (structure && datasets.length === 0) {
      setDatasets([structure.datasets[0]]);
    }
  }, [structure, datasets, setDatasets]);

  // Query the catalog when datasets or filters change.
  useEffect(() => {
    if (!structure) return;
    if (
      !catalogQueries ||
      datasets !== catalogQueries.datasets ||
      filters !== catalogQueries.combinedFilters
    ) {
      queryCatalog();
    }
  }, [structure, datasets, filters, catalogQueries, queryCatalog]);

  // Update time values when new catalog queries are performed.
  useEffect(() => {
    if (catalogQueries && timeDimension) {
      setTimeValues(catalogQueries.combinedFilters[timeDimension.name]);
    }
  }, [catalogQueries, timeDimension, setTimeValues]);

  // Update map feature state when the dataset or filters change.
  useEffect(() => {
    (async () => {
      if (mapDataUrl) {
        if (mapFeatureValuesAbortController) {
          mapFeatureValuesAbortController.abort("map state changed");
        }
        const newAbortController = new AbortController();
        setMapFeatureValuesAbortController(newAbortController);

        setMapFeatureValuesLoading(true);
        let data;
        try {
          data = await getNdJson(mapDataUrl, {
            signal: newAbortController.signal,
          });
        } catch (err) {
          if (err === "map state changed") return;
          throw err;
        }

        if (data.length === 1) {
          setMapFeatureValues(data[0]);
          setMapFeatureValuesLoading(false);
        } else {
          console.error(`Expected 1 row, received ${data.length}`, data);
        }
      } else {
        setMapFeatureValues({});
      }
    })();
  }, [mapDataUrl]);

  // Reload user information when the application loads.
  // This also allows us to get a fresh ACCESS token, if necessary.
  useEffect(() => {
    if (user) {
      (async () => {
        // Note: This would need the getUserInfo function to be accessible
        // For now, this is a placeholder - the actual implementation would need
        // to be adjusted based on how the state functions are exposed
        // const userInfo = await getUserInfo(user);
        // setUser(userInfo.error ? null : { ...user, ...userInfo });
      })();
    }
  }, []); // Only run once on mount

  // Reset the activity when the user logs out.
  useEffect(() => {
    if (activity !== "data" && !user) {
      // activity = "data"; - This would need to be exposed as an action
    }
  }, [activity, user]);

  // Load a list of portal users when a user logs in.
  useEffect(() => {
    if (user?.clickupId && users.length === 0) {
      (async () => {
        // users = (await getManagementJson("/users")).sort((a, b) =>
        //   a.fullName < b.fullName ? -1 : 1,
        // )
      })();
    }
  }, [user?.clickupId, users.length]);

  // Load the task list.
  useEffect(() => {
    if (activity === "issues" && issueFilterTags) {
      reloadTasks();
    }
  }, [activity, issueFilterTags, reloadTasks]);

  // Load an individual task when an issue is selected.
  useEffect(() => {
    if (activity === "issues") {
      reloadTask();
    }
  }, [activity, reloadTask]);

  // Load possible task statuses when the application loads.
  useEffect(() => {
    if (user) {
      (async () => {
        // taskStatuses = await getStatuses()
      })();
    }
  }, [user]);
}
