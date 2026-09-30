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
export const managementBaseUrl =
  import.meta.env.VITE_MANAGEMENT_BASE_URL ||
  "https://api.mpdp.coastal.la.gov/v1/management";
export const loginUrl = `${managementBaseUrl}/login`;
export const clickupUrl = `${managementBaseUrl}/clickup`;
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
export const selectionColorLabels = [
  "Red",
  "Cyan",
  "Yellow",
  "Purple",
  "Teal",
  "Indigo",
  "Lime",
  "Orange",
  "Green",
  "Blue",
];
export const qaqcTagOptions = [
  { value: "type:qaqc_high", label: "Type: QA/QC (High Concern)" },
  { value: "type:qaqc_moderate", label: "Type: QA/QC (Moderate Concern)" },
  { value: "type:qaqc_low", label: "Type: QA/QC (Low Concern)" },
  { value: "type:narrative", label: "Type: Narrative" },
  { value: "impact:project", label: "Impact: Project" },
  { value: "impact:fwoa", label: "Impact: FWOA" },
  { value: "theme:stg", label: "Theme: Water Levels and Inundation" },
  { value: "theme:sal", label: "Theme: Salinities and Estuarine Gradient" },
  { value: "theme:lnd", label: "Theme: Land Change" },
  {
    value: "theme:veg",
    label: "Theme: Vegetation Coverage and Habitat Diversity",
  },
  { value: "theme:sed", label: "Theme: Sedimentation Patterns" },
  { value: "theme:hs", label: "Theme: Habitat Suitabilities" },
  { value: "theme:wave", label: "Theme: Wave Generation Conditions" },
  { value: "story:comp", label: "Storyline: Compartments Scale" },
  { value: "story:basin", label: "Storyline: Basin Scale" },
  { value: "story:coast", label: "Storyline: Coastwide Scale" },
  { value: "story:ad", label: "Storyline: Annual/Decadal Trends" },
  { value: "story:dms", label: "Storyline: Daily/Monthly/Seasonal Trends" },
  { value: "story:time", label: "Storyline: Changes Over Time" },
  { value: "story:scenario", label: "Storyline: Changes Across Scenarios" },
];
