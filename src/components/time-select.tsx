import { usePortalState } from "../helpers/state";

import { Box } from "@primer/react";
import { Range } from "react-range";

export default function TimeSelect() {
  const { timeChoices, timeValues, setTimeValues } = usePortalState();

  const choices = timeChoices.value;
  const selected = timeValues.value;

  if (!choices.length || !selected.length) return;

  const values = selected.map((value) => choices.indexOf(value));

  return (
    <Box sx={{ padding: "12px", width: "100%" }}>
      <Range
        label="Select your value"
        step={1}
        min={0}
        max={choices.length - 1}
        values={values}
        onChange={(idxs) => setTimeValues(idxs.map((idx) => choices[idx]))}
        renderTrack={({ props, children }) => (
          <Box
            {...props}
            style={{
              ...props.style,
              height: "6px",
              width: "100%",
            }}
            sx={{ backgroundColor: "btn.activeBg" }}
          >
            {children}
          </Box>
        )}
        renderThumb={({ index, props, isDragged }) => (
          <Box
            {...props}
            key={props.key}
            style={{
              ...props.style,
              alignItems: "center",
              borderWidth: "1px",
              borderStyle: "solid",
              borderRadius: "4px",
              boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
              display: "flex",
              height: "24px",
              justifyContent: "center",
              width: "24px",
            }}
            sx={{
              backgroundColor: "btn.bg",
              borderColor: "btn.border",
            }}
          >
            {/* Label */}
            <Box
              style={{
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
                padding: "2px 8px",
                position: "absolute",
                top: "-30px",
              }}
              sx={{ backgroundColor: "fg.default", color: "canvas.inset" }}
            >
              {selected[index]}
            </Box>
            {/* Caret */}
            <Box
              style={{
                fontSize: "12px",
                position: "absolute",
                top: "-16px",
              }}
              sx={{ color: "fg.default" }}
            >
              &#9660;
            </Box>
            {/* Tick */}
            <Box
              style={{
                height: "16px",
                width: "5px",
              }}
              sx={{ backgroundColor: isDragged ? "accent.fg" : "fg.subtle" }}
            />
          </Box>
        )}
      />
    </Box>
  );
}
