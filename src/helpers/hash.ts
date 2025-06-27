import { batch, effect, signal, untracked } from "@preact/signals-react";
import { portalBaseUrl } from "./config";

export const getHashParams = () =>
  new URLSearchParams(window.location.hash.replace(/^#/, ""));

export const getHashString = (params) => {
  let hashString = params.toString();
  // Fix encoding of map parameter.
  if (params.has("map"))
    hashString = hashString.replace(
      /(^|&)map=[^&]+/,
      `$1map=${params.get("map")}`,
    );
  return hashString ? `#${hashString}` : "";
};

export const setHash = (params) =>
  window.history.replaceState(window.history.state, "", getHashString(params));

const hashCallbacks: ((params: URLSearchParams) => void)[] = [];

export const initHashSignals = () => {
  effect(() => {
    const params = getHashParams();
    window.addEventListener(
      "hashchange",
      () =>
        batch(() => {
          for (const hashCallback of hashCallbacks) hashCallback(params);
        }),
      false,
    );
  });
};

export const hashSignalBase = (fromHash, updateHash) => {
  // Create the signal.
  const sig = signal(fromHash(getHashParams()));

  // Register a callback to be called when the hash changes.
  hashCallbacks.push(
    (params: URLSearchParams) =>
      (sig.value = untracked(() => fromHash(params))),
  );

  // When the signal value changes, rebuild the URL hash.
  effect(() => {
    const params = getHashParams();
    const value = sig.value;
    untracked(() => updateHash(params, value));
    setHash(params);
  });

  return sig;
};

export const hashSignal = (
  hashKey: string,
  defaultValue,
  encoder = (val) => val,
  decoder = (val) => val,
) => {
  const fromHash = (params) =>
    params.has(hashKey) ? decoder(params.get(hashKey)) : defaultValue;
  const updateHash = (params, value) => {
    if (encoder(value) === encoder(defaultValue)) params.delete(hashKey);
    else params.set(hashKey, encoder(value));
  };
  return hashSignalBase(fromHash, updateHash);
};

export const datasetsSignal = (structure) => {
  const fromHash = (params) => {
    const variables = params.getAll("variable") || [];
    const grids = params.getAll("grid") || [];
    const timeUnits = params.getAll("time_unit") || [];

    return (structure.value?.datasets || []).filter((dataset) => {
      const variableIdx = variables.indexOf(dataset.variable.name);
      if (variableIdx == -1) return false;
      const gridIdx = grids.indexOf(dataset.grid.name);
      const timeUnitIdx = timeUnits.indexOf(dataset.time_unit);
      return gridIdx == variableIdx && timeUnitIdx == variableIdx;
    });
  };

  const updateHash = (params, value) => {
    if (!structure.value) return;

    params.delete("variable");
    params.delete("grid");
    params.delete("time_unit");

    for (let dataset of value) {
      params.append("variable", dataset.variable.name);
      params.append("grid", dataset.grid.name);
      params.append("time_unit", dataset.time_unit);
    }
  };

  const sig = hashSignalBase(fromHash, updateHash);

  effect(() => {
    sig.value = fromHash(getHashParams());
  });

  return sig;
};

export const filtersSignal = (structure) => {
  const fromHash = (params) => {
    const value = {};
    for (let dimension of structure.value?.dimensions || []) {
      if (["dataset", "metadata"].includes(dimension.type)) continue;
      let dimensionValues = params.getAll(dimension.name);
      if (dimensionValues.length) value[dimension.name] = dimensionValues;
    }
    return value;
  };

  const updateHash = (params, value) => {
    if (!structure.value) return;

    for (let dimension of structure.value.dimensions) {
      if (["dataset", "metadata"].includes(dimension.type)) continue;
      params.delete(dimension.name);
      if (dimension.name in value)
        for (let dimensionValue of value[dimension.name])
          params.append(dimension.name, dimensionValue);
    }
  };

  const sig = hashSignalBase(fromHash, updateHash);

  effect(() => {
    sig.value = fromHash(getHashParams());
  });

  return sig;
};

export const getPermalink = ({
  include,
  exclude,
}: {
  include?: string[];
  exclude?: string[];
}) => {
  const params = getHashParams();
  if (include)
    for (const key of params.keys())
      if (!include.includes(key)) params.delete(key);
  if (exclude) for (const key of exclude) params.delete(key);
  return `${portalBaseUrl}#${params}`;
};

export const mergeHash = (url: string) => {
  const params = getHashParams();
  const mergeParams = new URLSearchParams(url.split("#")[1]);
  for (const [key] of mergeParams) params.delete(key);
  for (const [key, value] of mergeParams) params.append(key, value);
  window.location.hash = getHashString(params);
};
