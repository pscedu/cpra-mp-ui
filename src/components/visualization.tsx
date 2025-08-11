import useMeasure from "react-use-measure";
import { useTheme } from "@/components/theme-provider";
import { VegaLite } from "react-vega";
import { dark, excel } from "vega-themes";
import { useSignal } from "@preact/signals-react";
import { Ref, useEffect, useRef } from "react";
import { getJson } from "@/helpers/utils";

const darkTheme = { ...dark, background: "#161b22" };
const lightTheme = excel;

import { LoaderCircle } from "lucide-react";

export default function Visualization({ actions = false, spec, padding = 16 }) {
  const [ref, { height, width }] = useMeasure();
  const resizeTimeout: Ref<null | ReturnType<typeof setTimeout>> = useRef(null);
  const specJson = useSignal(typeof spec === "string" ? null : spec);
  const theme = useTheme();

  useEffect(() => {
    if (typeof spec === "string") {
      if (height && width) {
        const loadSpecJson = () => {
          (async () => {
            const specUrl = `${spec}${spec.includes("?") ? "" : "?"}&height=${Math.floor(height)}&width=${Math.floor(width)}`;
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
        />
      ) : null}
    </div>
  );
}
