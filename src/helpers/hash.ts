import { atom, Atom } from "jotai";
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

type HashAtom<T> = {
  atom: Atom<T>;
  fromHash: (params: URLSearchParams) => T;
  updateHash: (params: URLSearchParams, value: T) => void;
};

const hashAtoms: HashAtom<any>[] = [];

export const initHashAtoms = (reconcileState: () => void) => {
  // Set up hash change listener
  if (typeof window !== "undefined") {
    window.addEventListener(
      "hashchange",
      () => {
        const params = getHashParams();
        setHashUpdateMode(null);
        // Trigger updates for all hash atoms
        // Note: actual synchronization will happen in components via useEffect
        reconcileState();
        setHashUpdateMode("push");
      },
      false,
    );
  }
};

export const hashAtomBase = <T>(
  fromHash: (params: URLSearchParams) => T,
  updateHash: (params: URLSearchParams, value: T) => void,
) => {
  const baseAtom = atom<T>(fromHash(getHashParams()));
  const derivedAtom = atom(
    (get) => get(baseAtom),
    (get, set, newValue: T) => {
      set(baseAtom, newValue);
      const params = getHashParams();
      updateHash(params, newValue);
      setHash(params);
    },
  );

  hashAtoms.push({
    atom: baseAtom,
    fromHash,
    updateHash,
  });

  return derivedAtom;
};

export const hashAtom = <T>(
  hashKey: string,
  defaultValue: T,
  encoder = (val: T): string => val as unknown as string,
  decoder = (val: string | null): T => val as unknown as T,
  includeDefault = false,
): Atom<T> => {
  const fromHash = (params: URLSearchParams) =>
    params.has(hashKey) ? decoder(params.get(hashKey)) : defaultValue;
  const updateHash = (params: URLSearchParams, value: T) => {
    if (!includeDefault && encoder(value) === encoder(defaultValue))
      params.delete(hashKey);
    else params.set(hashKey, encoder(value));
  };
  return hashAtomBase(fromHash, updateHash);
};

export const datasetsAtom = (structure: Atom<any>) => {
  const fromHash = (params: URLSearchParams, structureValue: any) => {
    const variables = params.getAll("variable") || [];
    const grids = params.getAll("grid") || [];
    const timeUnits = params.getAll("time_unit") || [];

    return (structureValue?.datasets || []).filter((dataset: any) => {
      const variableIdx = variables.indexOf(dataset.variable.name);
      if (variableIdx == -1) return false;
      const gridIdx = grids.indexOf(dataset.grid.name);
      const timeUnitIdx = timeUnits.indexOf(dataset.time_unit);
      return gridIdx == variableIdx && timeUnitIdx == variableIdx;
    });
  };

  const updateHash = (
    params: URLSearchParams,
    value: any,
    structureValue: any,
  ) => {
    if (!structureValue) return;

    params.delete("variable");
    params.delete("grid");
    params.delete("time_unit");

    for (let dataset of value) {
      params.append("variable", dataset.variable.name);
      params.append("grid", dataset.grid.name);
      params.append("time_unit", dataset.time_unit);
    }
  };

  const baseAtom = atom<any[]>([]);
  const derivedAtom = atom(
    (get) => {
      const structureValue = get(structure);
      const current = get(baseAtom);
      if (structureValue && current.length === 0) {
        // Initialize from hash on first load
        return fromHash(getHashParams(), structureValue);
      }
      return current;
    },
    (get, set, newValue: any[]) => {
      const structureValue = get(structure);
      set(baseAtom, newValue);
      const params = getHashParams();
      updateHash(params, newValue, structureValue);
      setHash(params);
    },
  );

  hashAtoms.push({
    atom: baseAtom,
    fromHash: (params: URLSearchParams) => fromHash(params, null),
    updateHash: (params: URLSearchParams, value: any) =>
      updateHash(params, value, null),
  });

  return derivedAtom;
};

export const filtersAtom = (structure: Atom<any>) => {
  const fromHash = (params: URLSearchParams, structureValue: any) => {
    const value: Record<string, any> = {};
    for (let dimension of structureValue?.dimensions || []) {
      if (["dataset", "metadata"].includes(dimension.type)) continue;
      let dimensionValues = params.getAll(dimension.name);
      if (dimensionValues.length) value[dimension.name] = dimensionValues;
    }
    return value;
  };

  const updateHash = (
    params: URLSearchParams,
    value: any,
    structureValue: any,
  ) => {
    if (!structureValue) return;

    for (let dimension of structureValue.dimensions) {
      if (["dataset", "metadata"].includes(dimension.type)) continue;
      params.delete(dimension.name);
      if (dimension.name in value)
        for (let dimensionValue of value[dimension.name])
          params.append(dimension.name, dimensionValue);
    }
  };

  const baseAtom = atom<Record<string, any>>({});
  const derivedAtom = atom(
    (get) => {
      const structureValue = get(structure);
      const current = get(baseAtom);
      if (structureValue && Object.keys(current).length === 0) {
        // Initialize from hash on first load
        return fromHash(getHashParams(), structureValue);
      }
      return current;
    },
    (get, set, newValue: Record<string, any>) => {
      const structureValue = get(structure);
      set(baseAtom, newValue);
      const params = getHashParams();
      updateHash(params, newValue, structureValue);
      setHash(params);
    },
  );

  hashAtoms.push({
    atom: baseAtom,
    fromHash: (params: URLSearchParams) => fromHash(params, null),
    updateHash: (params: URLSearchParams, value: any) =>
      updateHash(params, value, null),
  });

  return derivedAtom;
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
