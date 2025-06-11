export const dataBaseUrl =
  import.meta.env.VITE_DATA_BASE_URL || "https://api.mpdp.coastal.la.gov/v1";
export const glyphsBaseUrl =
  import.meta.env.VITE_GLYPHS_BASE_URL ||
  "https://api.mpdp.coastal.la.gov/glyphs";
export const portalBaseUrl =
  import.meta.env.PORTAL_BASE_URL || "https://mpdp.coastal.la.gov";
export const spritesBaseUrl =
  import.meta.env.VITE_SPRITES_BASE_URL ||
  "https://api.mpdp.coastal.la.gov/sprites";
export const staticTilesBaseUrl =
  import.meta.env.VITE_STATIC_TILES_BASE_URL ||
  "https://api.mpdp.coastal.la.gov/tiles";
export const managementBaseUrl =
  import.meta.env.VITE_MANAGEMENT_BASE_URL ||
  "https://api.mpdp.coastal.la.gov/v1/management";
export const loginUrl = `${managementBaseUrl}/login`;
export const clickupUrl = `${managementBaseUrl}/clickup`;
export const fowaModelGroupIds = [500, 520];
export const selectionColors = [
  "ff0000",
  "0aefff",
  "ffd300",
  "be0aff",
  "0aff99",
  "580aff",
  "deff0a",
  "ff8700",
  "a1ff0a",
  "147df5",
];
