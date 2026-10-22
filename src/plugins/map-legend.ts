import { ControlPosition, IControl, Map } from "maplibre-gl";
import { format } from "d3-format";

// A row of a discrete legend's optional `layout`: a strip of swatches between two end
// labels, or a pair of outward arrows between two captions.
type LegendLayoutRow = {
  kind: "swatches" | "arrows";
  left?: string;
  right?: string;
  steps?: { color: string; label: string }[];
};

export class CPRAMapLegendControl implements IControl {
  _container: HTMLElement | undefined;
  _map: Map | undefined;

  getDefaultPosition(): ControlPosition {
    return "bottom-left";
  }

  onAdd(map: Map) {
    this._map = map;
    this.addEventHandlers();
    this._container = document.createElement("div");
    this._container.className =
      "maplibregl-ctrl maplibregl-ctrl-group cpra-map-legend";
    return this._container;
  }

  onRemove() {
    if (this._container?.parentNode)
      this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }

  addEventHandlers() {
    if (this._map) {
      const update = () => this.updateLegend();
      this._map.on("load", update);
      this._map.on("styledata", update);
    }
  }

  updateLegend() {
    if (this._map && this._container) {
      const legend = this._map.getGlobalState()?.legend;
      this.clearContainer();
      if (legend)
        for (const spec of legend.entries) {
          const entry = document.createElement("div");
          entry.className = "entry";

          if (spec.title) {
            const title = document.createElement("h2");
            title.className = "title";
            title.innerText = spec.title;

            if (spec.subtitle) {
              const subtitle = document.createElement("span");
              subtitle.className = "subtitle";
              subtitle.innerText = `(${spec.subtitle})`;
              title.innerText += " ";
              title.append(subtitle);
            }

            entry.append(title);
          }

          // `layout` is an optional arrangement of a discrete legend's key into labelled
          // rows; `steps` is always the full list, for a client that ignores `layout`.
          if (spec.type === "discrete" && spec.layout?.rows)
            this.addLayoutRows(entry, spec.layout.rows);
          else if (spec.type === "discrete")
            this.addDiscreteSteps(entry, spec.steps);
          else if (spec.type === "continuous")
            this.addContinuousSteps(entry, spec);

          this._container.append(entry);
        }
    }
  }

  addContinuousSteps(entry, spec) {
    const { numberFormat, steps } = spec;
    if (steps.length < 2) return;

    const start = steps[0].value;
    const end = steps[steps.length - 1].value;
    const range = end - start;
    const stops = steps.map((step) => ({
      ...step,
      pct: ((step.value - start) * 100) / range,
    }));

    const container = document.createElement("div");
    container.className = "continuous-steps";

    const symbol = document.createElement("div");
    symbol.className = "continuous-symbol";
    const gradient = stops
      .map((stop) => `${stop.color} ${stop.pct}%`)
      .join(", ");
    symbol.style.backgroundImage = `linear-gradient(to right, ${gradient})`;
    container.append(symbol);

    const ticks = document.createElement("div");
    ticks.className = "continuous-ticks";
    const formatter = format(numberFormat);
    for (const stop of stops) {
      const tick = document.createElement("div");
      tick.className = "tick";
      tick.style.left = `${stop.pct}%`;
      const label = document.createElement("span");
      label.className = "label";
      label.style.left = `-${stop.pct}%`;
      label.innerText = stop.value === 0 ? "0" : formatter(stop.value);
      tick.append(label);
      ticks.append(tick);
    }

    container.append(ticks);

    entry.append(container);
  }

  addDiscreteSteps(entry, steps) {
    const seenLabels = new Set();
    for (const step of steps) {
      // Keep track of the labels we have seen, and don't add them to the legend again.
      if (seenLabels.has(step.label)) continue;
      seenLabels.add(step.label);

      const container = document.createElement("div");
      container.className = "discrete-step";
      const symbol = document.createElement("div");
      symbol.className = "discrete-symbol";
      symbol.style.backgroundColor = step.color;
      const label = document.createElement("span");
      label.className = "discrete-label";
      label.innerText = step.label;
      container.append(symbol, label);
      entry.append(container);
    }
  }

  addLayoutRows(entry: HTMLElement, rows: LegendLayoutRow[]) {
    // One three-column grid for every row, so the end labels and the swatch strips line
    // up across rows.
    const grid = document.createElement("div");
    grid.className = "layout-rows";

    for (const row of rows) {
      const left = document.createElement("span");
      const right = document.createElement("span");
      left.innerText = row.left ?? "";
      right.innerText = row.right ?? "";
      const middle = document.createElement("div");

      if (row.kind === "arrows") {
        left.className = "layout-caption left";
        right.className = "layout-caption right";
        middle.className = "layout-arrows";
        for (const direction of ["left", "right"]) {
          const arrow = document.createElement("div");
          arrow.className = `layout-arrow ${direction}`;
          middle.append(arrow);
        }
      } else {
        left.className = "layout-label left";
        right.className = "layout-label right";
        middle.className = "layout-swatches";
        for (const step of row.steps ?? []) {
          // The strip has no room for each class's label, so it is the swatch's tooltip.
          const symbol = document.createElement("div");
          symbol.className = "layout-symbol";
          symbol.style.backgroundColor = step.color;
          symbol.title = step.label;
          symbol.setAttribute("aria-label", step.label);
          middle.append(symbol);
        }
      }

      grid.append(left, middle, right);
    }

    entry.append(grid);
  }

  clearContainer() {
    if (this._container) this._container.innerHTML = "";
  }
}
