import { effect, signal } from "@preact/signals-react";

export const getHashParams = () =>
  new URLSearchParams(window.location.hash.replace(/^#/, ""));

export const getHashString = (params) => {
  let hashString = params.toString();
  // Fix encoding of map parameter.
  if (params.has("map"))
    hashString = hashString.replace(
      /(^|&)map=[^&]+/,
      `$1map=${params.get("map")}`
    );
  return hashString ? `#${hashString}` : "";
};

export const hashSignalBase = (fromHash, updateHash) => {
  // Create the signal.
  const sig = signal(fromHash(getHashParams()));

  // Add a listener for the hashchange event that updates the signal value.
  effect(() =>
    window.addEventListener(
      "hashchange",
      () => (sig.value = fromHash(getHashParams())),
      false
    )
  );

  // When the signal value changes, rebuild the URL hash.
  effect(() => {
    const params = getHashParams();
    updateHash(params, sig.value);

    window.history.replaceState(
      window.history.state,
      "",
      getHashString(params)
    );
  });

  return sig;
};

export const hashSignal = (
  hashKey: string,
  defaultValue,
  encoder = (val) => val,
  decoder = (val) => val
) => {
  const fromHash = (params) =>
    params.has(hashKey) ? decoder(params.get(hashKey)) : defaultValue;
  const updateHash = (params, value) => {
    if (encoder(value) === encoder(defaultValue)) params.delete(hashKey);
    else params.set(hashKey, encoder(value));
  };
  return hashSignalBase(fromHash, updateHash);
};
