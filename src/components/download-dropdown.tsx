import {
  catalogQueriesAtom,
  chartImageFormatAtom,
  derivedAnalysisAtom,
  geometryDataFormatAtom,
  modeAtom,
  selectedGeographiesAtom,
  tabularDataFormatAtom,
} from "@/helpers/state";
import { Atom, useAtom, useAtomValue } from "jotai";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Settings } from "lucide-react";
import { Option } from "@/helpers/types";

const chartImageFormatOptions = [
  { value: "png", label: "PNG" },
  { value: "svg", label: "SVG" },
];
const geometryDataFormatOptions = [
  { value: "zip", label: "GeoPackage and GeoTIFF" },
  { value: "gdb.zip", label: "ESRI File Geodatabase" },
];
const tabularDataFormatOptions = [
  { value: "csv", label: "CSV" },
  { value: "ndjson", label: "Newline Delimited JSON" },
  { value: "parquet", label: "Parquet" },
];

function downloadChart(type: string, filename: string, id: string = "default") {
  const e = new CustomEvent("chartDownload", {
    detail: { id, type, filename },
  });
  window.dispatchEvent(e);
}

function LinkMenuItem({ children, href }) {
  return (
    <DropdownMenuItem asChild>
      <a href={href}>{children}</a>
    </DropdownMenuItem>
  );
}

function DownloadSettingGroup({
  atom,
  label,
  options,
}: {
  atom: Atom<string>;
  label: string;
  options: Option<string>[];
}) {
  const [value, setValue] = useAtom(atom);
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>{label}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
        {options.map((option) => (
          <DropdownMenuRadioItem value={option.value} key={option.value}>
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  );
}

export default function DownloadDropdown() {
  const chartImageFormat = useAtomValue(chartImageFormatAtom);
  const geometryDataFormat = useAtomValue(geometryDataFormatAtom);
  const tabularDataFormat = useAtomValue(tabularDataFormatAtom);

  const analysis = useAtomValue(modeAtom);
  const derivedAnalysis = useAtomValue(derivedAnalysisAtom);
  const selectedGeographies = useAtomValue(selectedGeographiesAtom);
  const catalogQueries = useAtomValue(catalogQueriesAtom);

  const mapCatalogQuery = catalogQueries.getMapCatalogQuery();
  const isRaster = mapCatalogQuery.dataset.grid.isRaster();
  const timeIncrement = mapCatalogQuery.getTimeIncrement();
  const gridLabel = mapCatalogQuery.dataset.grid.label;

  const getSelectedOptionLabel = (value: string, options: Option<string>[]) =>
    options.find((option) => option.value === value)?.label;

  const chartImageFormatLabel = getSelectedOptionLabel(
    chartImageFormat,
    chartImageFormatOptions,
  );
  const modelGeometriesFormatLabel = getSelectedOptionLabel(
    geometryDataFormat,
    geometryDataFormatOptions,
  );
  const tabularDataFormatLabel = getSelectedOptionLabel(
    tabularDataFormat,
    tabularDataFormatOptions,
  );

  const dataDownloadTypes = [[`Selected ${timeIncrement}s`, "geography"]];
  if (selectedGeographies.length)
    dataDownloadTypes.push([`Selected ${gridLabel}s`, "time"]);
  if (!isRaster)
    dataDownloadTypes.push([`All ${timeIncrement}s and ${gridLabel}s`, "all"]);

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="grow cursor-pointer bg-green-700 hover:bg-green-600 text-white">
            <Download /> Download
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Model Data</DropdownMenuLabel>
            {dataDownloadTypes.map(([label, downloadType]) => {
              const format =
                isRaster && downloadType === "geography"
                  ? "tif"
                  : tabularDataFormat;
              return (
                <LinkMenuItem
                  href={mapCatalogQuery.getDataDownloadUrl({
                    analysis,
                    derivedAnalysis,
                    format,
                    geographies:
                      downloadType === "time" ? selectedGeographies : null,
                    includeTimeDimension: downloadType === "geography",
                  })}
                >
                  {label} (
                  {format === "tif" ? "GeoTIFF" : tabularDataFormatLabel})
                </LinkMenuItem>
              );
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Other Downloads</DropdownMenuLabel>
            <LinkMenuItem
              href={`https://files.mpdap.coastal.la.gov/static/model-geometries.${geometryDataFormat}`}
            >
              Model Geometries ({modelGeometriesFormatLabel})
            </LinkMenuItem>
            {selectedGeographies.length > 0 && (
              <DropdownMenuItem
                onClick={() =>
                  downloadChart(chartImageFormat, `chart.${chartImageFormat}`)
                }
              >
                Chart Image ({chartImageFormatLabel})
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <Settings />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          <DownloadSettingGroup
            atom={tabularDataFormatAtom}
            label="Tabular Data Format"
            options={tabularDataFormatOptions}
          />
          <DropdownMenuSeparator />
          <DownloadSettingGroup
            atom={geometryDataFormatAtom}
            label="Geometry Data Format"
            options={geometryDataFormatOptions}
          />
          <DropdownMenuSeparator />
          <DownloadSettingGroup
            atom={chartImageFormatAtom}
            label="Chart Image Format"
            options={chartImageFormatOptions}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
