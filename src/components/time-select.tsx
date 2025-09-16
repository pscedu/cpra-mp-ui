import { usePortalState } from "@/helpers/state";
import { parseDate } from "@/helpers/utils";

import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Range } from "react-range";
import { SelectionModeDropdown } from "./selection-mode-dropdown";

export default function TimeSelect() {
  const { timeChoices, timeDimension, timeValues, setTimeValues } =
    usePortalState();

  const choices = timeChoices.value;
  const selected = timeValues.value;

  if (!choices.length || !selected.length) return;

  const isYear = typeof choices[0] === "number";
  const values = selected.map((value) => choices.indexOf(value));
  const label = timeDimension.value ? timeDimension.value.label : "Value";
  const editLabel = `Edit ${label.toLowerCase()}`;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn("w-[140px] justify-start text-left font-normal")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected.join(", ")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={`w-auto p-${isYear ? "4" : "0"}`}>
          {isYear ? (
            <>
              <h2 className="mb-2">{editLabel}</h2>
              {selected.map((value, idx) => (
                <div key={idx} className="mt-2">
                  <input
                    type="number"
                    defaultValue={value}
                    min={choices[0]}
                    max={choices[choices.length - 1]}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      if (choices.includes(newValue)) {
                        const newSelected = [...selected];
                        newSelected[idx] = newValue;
                        setTimeValues(newSelected);
                      }
                    }}
                  />
                </div>
              ))}
            </>
          ) : (
            <Calendar
              mode={selected.length > 1 ? "multiple" : "single"}
              selected={selected.map(parseDate)}
              defaultMonth={parseDate(selected[0])}
              onSelect={(value) =>
                setTimeValues([value.toISOString().split("T")[0]])
              }
              disabled={(date) =>
                !choices.includes(date.toISOString().split("T")[0])
              }
              initialFocus
            />
          )}
        </PopoverContent>
      </Popover>
      {/* Time slider */}
      <div className="w-full px-4">
        <Range
          label="Select your value"
          step={1}
          disabled={choices.length < 2}
          min={0}
          max={choices.length > 1 ? choices.length - 1 : 1}
          values={values}
          onChange={(idxs) => setTimeValues(idxs.map((idx) => choices[idx]))}
          renderTrack={({ props, children }) => (
            <div
              {...props}
              className="w-full bg-accent"
              style={{
                ...props.style,
                height: "6px",
              }}
            >
              {children}
            </div>
          )}
          // Index needs to be here for multiple thumbs to work, even though it's not used.
          renderThumb={({ props, isDragged, index }) => (
            <div
              {...props}
              key={props.key}
              className="bg-muted"
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
            >
              {/* Tick */}
              <div
                className={isDragged ? "bg-foreground" : "bg-ring"}
                style={{
                  height: "16px",
                  width: "5px",
                }}
              />
            </div>
          )}
        />
      </div>
      <SelectionModeDropdown
        dimensionName={"time"}
        dimensionLabel={label}
        maxLength={values.length}
        optionsLength={choices.length}
        setMaxLength={(ml) => {
          const newLength = Math.min(ml, 2);
          if (newLength > values.length) {
            let newValues = values.slice();
            if (values[0] === values.length - 1) newValues.splice(0, 0, 0);
            else newValues.push(0);
            setTimeValues(newValues.map((idx) => choices[idx]));
          } else if (newLength < values.length) {
            setTimeValues([choices[values[0]]]);
          }
        }}
        supportsConcatenate={true}
        supportsSubtract={true}
      />
    </>
  );
}
