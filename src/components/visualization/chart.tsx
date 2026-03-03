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
  function Chart({
    actions = false,
    children,
    className = "",
    endDate,
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
    setEndDate?: (date: string | null) => void | null;
    setStartDate?: (date: string | null) => void | null;
    spec: any;
    startDate?: string | null;
    padding?: number;
    style?: CSSProperties;
    theme?: "dark" | "light";
  }) {
    const [measureRef, { height, width }] = useMeasure();

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
    }, [spec, height, width]);

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
