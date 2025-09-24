import useMeasure from "react-use-measure";
import { useTheme } from "@/components/theme-provider";
import { VegaLite } from "react-vega";
import { dark, excel } from "vega-themes";
import { batch, useSignal } from "@preact/signals-react";
import { Ref, useEffect, useRef } from "react";
import { getJson } from "@/helpers/utils";
import { usePortalState } from "@/helpers/state";

const darkTheme = { ...dark, background: "#161b22" };
const lightTheme = excel;

import { LoaderCircle } from "lucide-react";

export default function Visualization({ actions = false, spec, padding = 16 }) {
  const { endDate, startDate } = usePortalState();
  const [ref, { height, width }] = useMeasure();
  const resizeTimeout: Ref<null | ReturnType<typeof setTimeout>> = useRef(null);
  const specJson = useSignal(typeof spec === "string" ? null : spec);
  const theme = useTheme();

  useEffect(() => {
    if (typeof spec === "string") {
      if (height && width) {
        const loadSpecJson = () => {
          (async () => {
            let specUrl = `${spec}${spec.includes("?") ? "" : "?"}&height=${Math.floor(height)}&width=${Math.floor(width)}`;
            if (startDate.value) specUrl += `&start_date=${startDate.value}`;
            if (endDate.value) specUrl += `&end_date=${endDate.value}`;
            specJson.value = await getJson(specUrl);
          })();
        };
        if (specJson.peek() || resizeTimeout.current) {
          specJson.value = null;
          if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
          resizeTimeout.current = setTimeout(loadSpecJson, 250);
        } else {
          loadSpecJson();
        }
      }
    } else {
      specJson.value = spec;
    }
  }, [specJson, spec, height, width]);

  const signalListeners = {
    date_range: (_signal, value) => {
      const key = Object.keys(value)[0];
      if (!key) return;
      const [start, end] = value[key].map(
        (timestamp) => new Date(timestamp).toISOString().split("T")[0],
      );
      batch(() => {
        startDate.value = start;
        endDate.value = end;
      });
    },
  };
  const signalCleanup = {
    date_range: () =>
      batch(() => {
        startDate.value = null;
        endDate.value = null;
      }),
  };
  for (const signal of Object.keys(signalListeners))
    if (
      specJson.value &&
      !specJson.value?.params.find(({ name }) => signal === name)
    ) {
      delete signalListeners[signal];
      if (signal in signalCleanup) signalCleanup[signal]();
    }

  return (
    <div className="h-full w-full relative" ref={ref}>
      <LoaderCircle className="animate-spin absolute" />
      {specJson.value ? (
        <VegaLite
          actions={actions}
          className="absolute rounded-xl overflow-hidden"
          spec={specJson.value}
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
