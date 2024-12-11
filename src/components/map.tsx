import { useEffect, useRef } from "preact/hooks";
import { Map as GLMap } from "maplibre-gl";
import { usePortalState } from "../helpers/state";
import style from "./map.module.css";

import "maplibre-gl/dist/maplibre-gl.css";

import { Spinner } from "@primer/react";

// Map using MapLibre GL.
export default function Map() {
  const { mapDataLoading, mapStyle } = usePortalState();

  const container = useRef(null);
  const map = useRef(null);

  const initMap = () => {
    map.current = new GLMap({
      container: container.current,
      center: [-91.5, 29.75],
      hash: "map",
      style: mapStyle.value,
      zoom: 8,
    });

    // // Add map event handlers.
    // map.current.on("data", () => {});

    // map.current.on("contextmenu", "geography-fill", (e) => {
    //   // Stop propagation of the click event so that it doesn't cause the context menu
    //   // to close.
    //   e.originalEvent.stopPropagation();
    //   contextMenu.value = {
    //     type: "geography-select",
    //     feature: e.features[0],
    //     x: e.originalEvent.clientX,
    //     y: e.originalEvent.clientY,
    //   };
    // });

    // map.current.on("click", "geography-fill", (e) => {
    //   if (e.features) {
    //     const newGeographies = geographies.peek().slice();
    //     for (let feature of e.features) {
    //       let idx = newGeographies.indexOf(feature.id);
    //       idx === -1
    //         ? newGeographies.push(feature.id)
    //         : newGeographies.splice(idx, 1);
    //     }
    //     geographies.value = newGeographies;
    //   }
    // });
    // map.current.on(
    //   "mousemove",
    //   "geography-fill",
    //   () => (map.getCanvas().style.cursor = "pointer")
    // );
    // map.current.on(
    //   "mouseleave",
    //   "geography-fill",
    //   () => (map.getCanvas().style.cursor = "")
    // );
  };

  // Initialize the map.
  useEffect(() => {
    if (container.current) {
      if (map.current) {
        map.current.setStyle(mapStyle.value);
      } else {
        initMap();
      }
    }
  }, [container.current, mapStyle.value]);

  // Clean up the map before the component unloads.
  useEffect(() => {
    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  return (
    <div class={style.mapContainer}>
      <div class={style.map} ref={container} />
      {mapDataLoading.value ? <Spinner /> : null}
    </div>
  );
}
