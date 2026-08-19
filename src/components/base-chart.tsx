import {
  CSSProperties,
  ReactNode,
  Ref,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import useMeasure from "react-use-measure";
import { useVegaEmbed } from "react-vega";
import { dark, excel } from "vega-themes";
import { getJson } from "@/helpers/utils";

export default memo(
  function BaseChart({
    actions = false,
    children,
    className = "",
    endDate,
    id = "default",
    setEndDate,
    setStartDate,
    spec,
    startDate,
    padding = 16,
    style = {},
    theme = "light",
  }: {
    actions?: boolean;
    children?: ReactNode;
    className?: string;
    endDate?: string | null;
    id?: string;
    setEndDate?: (date: string | null) => void | null;
    setStartDate?: (date: string | null) => void | null;
    spec: any;
    startDate?: string | null;
    padding?: number;
    style?: CSSProperties;
    theme?: "dark" | "light";
  }) {
    const [measureRef, { height, width }] = useMeasure();
    const isMeasured = Boolean(height && width);

    const resizeTimeout: Ref<null | ReturnType<typeof setTimeout>> =
      useRef(null);
    const [specJson, setSpecJson] = useState<any>(
      typeof spec === "string" ? null : spec,
    );

    const darkTheme = { ...dark, background: "transparent" };
    const lightTheme = { ...excel, background: "transparent" };

    const vegaRef = useRef<HTMLDivElement>(null);
    const embed = useVegaEmbed({
      ref: vegaRef,
      spec: specJson,
      options: {
        mode: "vega-lite",
        actions,
        config: theme === "dark" ? darkTheme : lightTheme,
        padding,
      },
    });

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spec, isMeasured]);

    useEffect(() => {
      // Width and height are applied to the live view instead of refetching
      // the spec. With autosize "fit", Vega writes the computed inner width
      // back into the `width` signal, so always set it from the measured
      // container width, never from `view.width()`. For vconcat specs the
      // top-level `height` signal doesn't drive the child heights - the main
      // chart's height lives in `concat_0_height` (stable across specs),
      // while the summary strip's is a hash-named signal (e.g.
      // `view_2d6a0d9e5bbb8eb2_1_height`) that must never be hardcoded. So we
      // probe for `concat_0_height` and either drive it directly or fall
      // back to `view.height()` for non-concat specs.
      let cancelled = false;

      const applySize = async (view: NonNullable<typeof embed>["view"]) => {
        if (width && Number.isFinite(width)) {
          view.width(width);
        }
        if (!height || !Number.isFinite(height)) {
          await view.runAsync();
          return;
        }

        let hasConcatHeight = true;
        try {
          view.signal("concat_0_height");
        } catch {
          hasConcatHeight = false;
        }

        if (!hasConcatHeight) {
          view.height(height);
          await view.runAsync();
          return;
        }

        await view.runAsync();
        if (cancelled) return;
        for (let i = 0; i < 2; i++) {
          const svg = vegaRef.current?.querySelector("svg");
          if (!svg) break;
          const rendered = svg.getBoundingClientRect().height;
          const delta = rendered - height;
          if (Math.abs(delta) <= 1) break;
          const current = view.signal("concat_0_height");
          view.signal("concat_0_height", Math.max(current - delta, 40));
          await view.runAsync();
          if (cancelled) return;
        }
      };

      if (embed?.view) applySize(embed.view);

      return () => {
        cancelled = true;
      };
    }, [embed, width, height]);

    useEffect(() => {
      const signalListeners = {
        date_range: (_signal: any, value: any) => {
          const key = Object.keys(value)[0];
          if (!key) return;
          const [start, end] = value[key].map(
            (timestamp: number) =>
              new Date(timestamp).toISOString().split("T")[0],
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

      for (const signal of Object.keys(signalListeners))
        embed?.view.addSignalListener(signal, (signalListeners as any)[signal]);

      return () => {
        for (const signal of Object.keys(signalListeners))
          embed?.view.removeSignalListener(
            signal,
            (signalListeners as any)[signal],
          );
      };
    }, [embed]);

    useEffect(() => {
      if (vegaRef.current) {
        const handleDownloadEvent = (e) => {
          if (e.detail.id === id)
            (async () => {
              const imageUrl = await embed?.view.toImageURL(e.detail.type);
              if (imageUrl) {
                const link = document.createElement("a");
                link.setAttribute("href", imageUrl);
                link.setAttribute("target", "_blank");
                link.setAttribute("download", e.detail.filename);
                link.dispatchEvent(new MouseEvent("click"));
              }
            })();
        };
        window.addEventListener("chartDownload", handleDownloadEvent);
        return () => {
          window.removeEventListener("chartDownload", handleDownloadEvent);
        };
      }
    }, [embed, id]);

    return (
      <div
        style={{
          height: "100%",
          position: "relative",
          width: "100%",
          ...style,
        }}
        ref={measureRef}
      >
        {children}
        {specJson ? (
          <div
            style={{
              height: `${height}px`,
              overflow: "hidden",
              position: "absolute",
              width: `${width}px`,
            }}
            className={className}
            ref={vegaRef}
          ></div>
        ) : null}
      </div>
    );
  },
  (oldProps, newProps) => {
    return Object.keys(oldProps)
      .filter(
        (key) => key !== "children" && !key.toLowerCase().includes("date"),
      )
      .every((key) => oldProps[key] === newProps[key]);
  },
);
