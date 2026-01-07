import { atom, Getter, WritableAtom } from "jotai";
import { portalBaseUrl } from "./config";
import { camelToSnake, debounce } from "./utils";
import { Store } from "jotai/vanilla/store";

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

type FromHashFn<T> = (params: URLSearchParams) => T;
type UpdateHashFn<T> = (params: URLSearchParams, value: T) => void;
type HashAtomConfig<T> = {
  atom: WritableAtom<T, [T], void>;
  fromHash?: FromHashFn<T>;
  updateHash?: UpdateHashFn<T>;
};

const hashAtoms: HashAtomConfig<any>[] = [];

type SimpleHashAtomOptions<T> = {
  key: string;
  encoder?: (val: T) => string;
  decoder?: (val: string) => T;
  includeDefault?: boolean;
};

type CustomHashAtomOptions<T> = {
  fromHash?: FromHashFn<T>;
  updateHash?: UpdateHashFn<T>;
};

type HashAtomOptions<T> = SimpleHashAtomOptions<T> | CustomHashAtomOptions<T>;

const writeHash = (get: Getter) => {
  const params = new URLSearchParams();
  for (const config of hashAtoms)
    if (config.updateHash) {
      config.updateHash(params, get(config.atom));
    }
  params.sort();
  const hashString = getHashString(params);
  // Only add a new history entry if the hash string has changed.
  if (hashString !== getHashString(getHashParams()))
    window.history.pushState(window.history.state, "", hashString);
};

const queueWriteHash = debounce(writeHash, 500);

export const hashEffect = (store: Store) => {
  writeHash(store.get);
  const handleHashChange = () => {
    const params = getHashParams();
    for (const config of hashAtoms)
      if (config.fromHash) {
        store.set(config.atom, config.fromHash(params));
      }
  };
  window.addEventListener("hashchange", handleHashChange, false);
  return () => window.removeEventListener("hashchange", handleHashChange);
};

export const simpleHashAtomFunctions = <T>(
  defaultValue: T,
  options: SimpleHashAtomOptions<T>,
): [FromHashFn<T>, UpdateHashFn<T>] => {
  const { key } = options;
  knownKeys.push(key);
  const encoder = options.encoder || ((val) => JSON.stringify(val));
  const decoder = options.decoder || ((val) => JSON.parse(val));
  const fromHash: FromHashFn<T> = (params) =>
    params.has(key) ? decoder(params.get(key) as string) : defaultValue;

  const updateHash: UpdateHashFn<T> = (params, value) => {
    if (!options.includeDefault && encoder(value) === encoder(defaultValue))
      params.delete(key);
    else params.set(key, encoder(value));
  };
  return [fromHash, updateHash];
};

const initialHashParams = getHashParams();
const knownKeys: string[] = [];

export const hashAtom = <T>(
  defaultValue: T,
  options: HashAtomOptions<T>,
): WritableAtom<T, [T], void> => {
  let fromHash: FromHashFn<T> | undefined = undefined;
  let updateHash: UpdateHashFn<T> | undefined = undefined;

  if ("key" in options) {
    [fromHash, updateHash] = simpleHashAtomFunctions(defaultValue, options);
  } else {
    fromHash = options.fromHash;
    updateHash = options.updateHash;
  }

  const baseAtom = atom<T>(
    fromHash ? fromHash(initialHashParams) : defaultValue,
  );
  hashAtoms.push({ atom: baseAtom, fromHash, updateHash });
  if (!updateHash) return baseAtom;
  return atom(
    (get) => get(baseAtom),
    (get, set, value) => {
      queueWriteHash(get);
      set(baseAtom, value);
    },
  );
};

export const hashObjectAtom = <T>(defaultValue: { [key: string]: T }) => {
  const attrFromHash: { [key: string]: FromHashFn<T> } = {};
  const attrUpdateHash: { [key: string]: UpdateHashFn<T> } = {};
  for (const key of Object.keys(defaultValue)) {
    const [fromHash, updateHash] = simpleHashAtomFunctions(defaultValue[key], {
      key: camelToSnake(key),
    });
    attrFromHash[key] = fromHash;
    attrUpdateHash[key] = updateHash;
  }
  const fromHash: FromHashFn<{ [key: string]: T }> = (params) => {
    const value: { [key: string]: T } = {};
    for (const key of Object.keys(defaultValue))
      value[key] = attrFromHash[key](params);
    return value;
  };
  const updateHash: UpdateHashFn<{ [key: string]: T }> = (
    params,
    value: { [key: string]: T },
  ) => {
    for (const key of Object.keys(defaultValue))
      attrUpdateHash[key](params, value[key]);
  };
  return hashAtom(defaultValue, { fromHash, updateHash });
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
