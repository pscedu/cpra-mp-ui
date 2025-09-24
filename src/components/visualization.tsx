import useMeasure from "react-use-measure";
import { useTheme } from "@/components/theme-provider";
import { useVegaEmbed } from "react-vega";
import { dark, excel } from "vega-themes";
import { useSignal } from "@preact/signals-react";
import { Ref, useEffect, useRef } from "react";

const darkTheme = { ...dark, background: "#161b22" };
const lightTheme = excel;

import { LoaderCircle } from "lucide-react";

function VisualizationVega({ specUrl, height, width, ...rest }) {
  const ref = useRef(null);
  const theme = useTheme();
  const embed = useVegaEmbed({
    ref,
    spec: `${specUrl}${specUrl.includes("?") ? "" : "?"}&height=${height}&width=${width}`,
    options: {
      config: theme.theme === "dark" ? darkTheme : lightTheme,
      mode: "vega-lite",
      ...rest,
    },
  });

  return (
    <div style={{ height: `${height}px`, width: `${width}px` }} ref={ref}>
      <LoaderCircle />
    </div>
  );
}

export default function Visualization({ actions = false, spec, padding = 16 }) {
  const [ref, { height, width }] = useMeasure();
  console.log({ height, width });

  return (
    <div className="h-full w-full overflow-hidden" ref={ref}>
      {height > 0 && width > 0 && (
        <VisualizationVega
          specUrl={spec}
          height={Math.floor(height)}
          width={Math.floor(width)}
          actions={actions}
          padding={padding}
        />
      )}
    </div>
  );
}
