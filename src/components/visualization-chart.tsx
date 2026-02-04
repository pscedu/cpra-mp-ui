import useMeasure from "react-use-measure";
import { useTheme } from "@/components/theme-provider";
import { VegaLite } from "react-vega";
import { dark, excel } from "vega-themes";
import { Ref, useEffect, useRef, useState } from "react";
import { getJson } from "@/helpers/utils";

const darkTheme = { ...dark, background: "#161b22" };
const lightTheme = excel;

import { LoaderCircle } from "lucide-react";

export default function VisualizationChart({
  actions = false,
  endDate,
  setEndDate,
  setStartDate,
  spec,
  startDate,
  padding = 16,
}: {
  actions?: boolean;
  endDate?: string | null;
  setEndDate?: (date: string | null) => void | null;
  setStartDate?: (date: string | null) => void | null;
  spec: any;
  startDate?: string | null;
  padding?: number;
}) {
  const [ref, { height, width }] = useMeasure();
  const resizeTimeout: Ref<null | ReturnType<typeof setTimeout>> = useRef(null);
  const [specJson, setSpecJson] = useState<any>(
    typeof spec === "string" ? null : spec,
  );
  const theme = useTheme();

  useEffect(() => {
    if (typeof spec === "string") {
      if (height && width) {
        const loadSpecJson = async () => {
          let specUrl = `${spec}${spec.includes("?") ? "" : "?"}&height=${Math.floor(height)}&width=${Math.floor(width)}`;
          if (startDate) specUrl += `&start_date=${startDate}`;
          if (endDate) specUrl += `&end_date=${endDate}`;
          const json = await getJson(specUrl);
          setSpecJson(json);
        };
        if (specJson || resizeTimeout.current) {
          setSpecJson(null);
          if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
          resizeTimeout.current = setTimeout(loadSpecJson, 250);
        } else {
          loadSpecJson();
        }
      }
    } else {
      setSpecJson(spec);
    }
  }, [spec, height, width]);

  const signalListeners = {
    date_range: (_signal: any, value: any) => {
      const key = Object.keys(value)[0];
      if (!key) return;
      const [start, end] = value[key].map(
        (timestamp: number) => new Date(timestamp).toISOString().split("T")[0],
      );
      if (setStartDate) setStartDate(start);
      if (setEndDate) setEndDate(end);
    },
  };
  const signalCleanup = {
    date_range: () => {
      if (setStartDate) setStartDate(null);
      if (setEndDate) setEndDate(null);
    },
  };
  for (const signal of Object.keys(signalListeners))
    if (
      specJson &&
      !specJson?.params?.find(({ name }: any) => signal === name)
    ) {
      delete (signalListeners as any)[signal];
      if (signal in signalCleanup) (signalCleanup as any)[signal]();
    }

  return (
    <div className="h-full w-full relative" ref={ref}>
      <LoaderCircle className="animate-spin absolute" />
      {specJson ? (
        <VegaLite
          actions={actions}
          className="absolute rounded-xl overflow-hidden"
          spec={specJson}
          style={{
            height: `${height}px`,
            width: `${width}px`,
          }}
          padding={padding}
          config={theme.theme === "dark" ? darkTheme : lightTheme}
          signalListeners={signalListeners}
        />
      ) : null}
    </div>
  );
}
