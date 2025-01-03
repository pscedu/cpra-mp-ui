import { useSignal } from "@preact/signals";
import { usePortalState } from "../helpers/state";
import { CalendarIcon } from "@primer/octicons-react";

import {
  AnchoredOverlay,
  Box,
  Button,
  Heading,
  IconButton,
  Text,
} from "@primer/react";
import { Range } from "react-range";
import { useRef } from "preact/hooks";

export default function TimeSelect() {
  const { timeChoices, timeDimension, timeValues, setTimeValues } =
    usePortalState();
  const editing = useSignal(false);
  const editContainer = useRef(null);

  const choices = timeChoices.value;
  const selected = timeValues.value;

  if (!choices.length || !selected.length) return;

  const values = selected.map((value) => choices.indexOf(value));
  const editLabel = `Edit ${timeDimension.value ? timeDimension.value.label.toLowerCase() : "value"}`;

  return (
    <>
      <AnchoredOverlay
        open={editing.value}
        onOpen={() => (editing.value = true)}
        onClose={() => (editing.value = false)}
        renderAnchor={(props) => (
          <IconButton
            {...props}
            icon={CalendarIcon}
            variant="invisible"
            aria-label={editLabel}
          />
        )}
        overlayProps={{
          role: "dialog",
          "aria-modal": true,
          "aria-label": `${editLabel} overlay`,
        }}
        focusZoneSettings={{
          disabled: true,
        }}
        preventOverflow={false}
      >
        <Box sx={{ p: 3 }}>
          <Heading
            sx={{
              fontSize: 2,
            }}
          >
            {editLabel}
          </Heading>
          <Text as="p" ref={editContainer}>
            {selected.map((value) => (
              <input
                type={typeof value === "number" ? "number" : "date"}
                value={value}
                min={choices[0]}
                max={choices[choices.length - 1]}
              />
            ))}
          </Text>
          <Button
            onClick={() => {
              setTimeValues(
                Array.from(editContainer.current.querySelectorAll("input")).map(
                  (input, i) => {
                    const value = input.value.includes("-")
                      ? input.value
                      : parseInt(input.value);
                    return choices.includes(value) ? value : selected[i];
                  }
                )
              );
              editing.value = false;
            }}
          >
            Update
          </Button>
        </Box>
      </AnchoredOverlay>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          padding: "12px",
          width: "100%",
        }}
      >
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
                  display: "flex",
                  flexDirection: "row",
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
    </>
  );
}
