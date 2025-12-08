import { atom, WritableAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { portalBaseUrl } from "./config";

export const getHashParams = () =>
  new URLSearchParams(window.location.hash.replace(/^#/, ""));

export const getHashString = (params: URLSearchParams) => {
  params.sort();
  let hashString = params.toString();
  // Fix encoding of map parameter.
  if (params.has("map"))
    hashString = hashString.replace(
      /(^|&)map=[^&]+/,
      `$1map=${params.get("map")}`,
    );
  return hashString ? `#${hashString}` : "";
};

let hashUpdateMode: string | null = "push";
let hashPushTime: number = new Date().getTime();

export const setHashUpdateMode = (mode: string | null) => {
  hashUpdateMode = mode;
};

export const setHash = (params: URLSearchParams) => {
  const newHashString = getHashString(params);
  if (hashUpdateMode && newHashString !== window.location.hash) {
    const currentTime = new Date().getTime();
    const updateMethod =
      hashUpdateMode === "replace" || currentTime - hashPushTime <= 1000
        ? "replaceState"
        : "pushState";
    window.history[updateMethod](
      window.history.state,
      "",
      getHashString(params),
    );
    if (hashUpdateMode === "pushState") hashPushTime = currentTime;
  }
};

// Track hash atoms for synchronization
type HashAtomConfig<T> = {
  atom: WritableAtom<T, [T], void>;
  fromHash: (params: URLSearchParams) => T;
  updateHash: (params: URLSearchParams, value: T) => void;
};

const hashAtoms: HashAtomConfig<any>[] = [];

// Internal atom to trigger hash sync from URL changes
const hashChangeCounterAtom = atom(0);

// Effect atom for hash change listener
export const hashSyncEffectAtom = atomEffect((get, set) => {
  const handleHashChange = () => {
    const params = getHashParams();
    setHashUpdateMode(null);

    // Update counter to trigger re-reads
    set(hashChangeCounterAtom, (c) => c + 1);

    // Update all hash atoms from URL
    for (const config of hashAtoms) {
      const newValue = config.fromHash(params);
      set(config.atom, newValue);
    }

    setHashUpdateMode("push");
  };

  window.addEventListener("hashchange", handleHashChange, false);
  return () => window.removeEventListener("hashchange", handleHashChange);
});

// Effect atom for writing hash to URL when atoms change
export const hashWriteEffectAtom = atomEffect((get, set) => {
  // Subscribe to all hash atoms
  for (const config of hashAtoms) {
    get(config.atom);
  }

  // When any hash atom changes, update the URL
  const params = getHashParams();
  for (const config of hashAtoms) {
    const value = get(config.atom);
    config.updateHash(params, value);
  }

  setHash(params);
});

export const hashAtomBase = <T>(
  fromHash: (params: URLSearchParams) => T,
  updateHash: (params: URLSearchParams, value: T) => void,
): WritableAtom<T, [T], void> => {
  const baseAtom = atom(fromHash(getHashParams()), (get, set, newValue: T) => {
    set(baseAtom, newValue);
  });

  hashAtoms.push({
    atom: baseAtom,
    fromHash,
    updateHash,
  });

  return baseAtom;
};

export const hashAtom = <T>(
  hashKey: string,
  defaultValue: T,
  encoder = (val: T): string => val as string,
  decoder = (val: string | null): T => val as T,
  includeDefault = false,
): WritableAtom<T, [T], void> => {
  const fromHash = (params: URLSearchParams) =>
    params.has(hashKey) ? decoder(params.get(hashKey)) : defaultValue;
  const updateHash = (params: URLSearchParams, value: T) => {
    if (!includeDefault && encoder(value) === encoder(defaultValue))
      params.delete(hashKey);
    else params.set(hashKey, encoder(value));
  };
  return hashAtomBase(fromHash, updateHash);
};

export const datasetsAtom = (structureAtom: any) => {
  const fromHash = (params: URLSearchParams, structure: any) => {
    const variables = params.getAll("variable") || [];
    const grids = params.getAll("grid") || [];
    const timeUnits = params.getAll("time_unit") || [];

    return (structure?.datasets || []).filter((dataset: any) => {
      const variableIdx = variables.indexOf(dataset.variable.name);
      if (variableIdx == -1) return false;
      const gridIdx = grids.indexOf(dataset.grid.name);
      const timeUnitIdx = timeUnits.indexOf(dataset.time_unit);
      return gridIdx == variableIdx && timeUnitIdx == variableIdx;
    });
  };

  const updateHash = (params: URLSearchParams, value: any, structure: any) => {
    if (!structure) return;

    params.delete("variable");
    params.delete("grid");
    params.delete("time_unit");

    for (let dataset of value) {
      params.append("variable", dataset.variable.name);
      params.append("grid", dataset.grid.name);
      params.append("time_unit", dataset.time_unit);
    }
  };

  const baseAtom = atom(
    (get) => {
      const structure = get(structureAtom);
      const params = getHashParams();
      return fromHash(params, structure);
    },
    (get, set, newValue: any) => {
      set(baseAtom, newValue);
    },
  );

  hashAtoms.push({
    atom: baseAtom,
    fromHash: (params) => fromHash(params, null),
    updateHash: (params, value) => updateHash(params, value, null),
  });

  return baseAtom;
};

export const filtersAtom = (structureAtom: any) => {
  const fromHash = (params: URLSearchParams, structure: any) => {
    const value: any = {};
    for (let dimension of structure?.dimensions || []) {
      if (["dataset", "metadata"].includes(dimension.type)) continue;
      let dimensionValues = params.getAll(dimension.name);
      if (dimensionValues.length) value[dimension.name] = dimensionValues;
    }
    return value;
  };

  const updateHash = (params: URLSearchParams, value: any, structure: any) => {
    if (!structure) return;

    for (let dimension of structure.dimensions) {
      if (["dataset", "metadata"].includes(dimension.type)) continue;
      params.delete(dimension.name);
      if (dimension.name in value)
        for (let dimensionValue of value[dimension.name])
          params.append(dimension.name, dimensionValue);
    }
  };

  const baseAtom = atom(
    (get) => {
      const structure = get(structureAtom);
      const params = getHashParams();
      return fromHash(params, structure);
    },
    (get, set, newValue: any) => {
      set(baseAtom, newValue);
    },
  );

  hashAtoms.push({
    atom: baseAtom,
    fromHash: (params) => fromHash(params, null),
    updateHash: (params, value) => updateHash(params, value, null),
  });

  return baseAtom;
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
