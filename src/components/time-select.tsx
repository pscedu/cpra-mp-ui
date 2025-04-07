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

export default function TimeSelect() {
  const { timeChoices, timeDimension, timeValues, setTimeValues } =
    usePortalState();

  const choices = timeChoices.value;
  const selected = timeValues.value;

  if (!choices.length || !selected.length) return;

  const isYear = typeof choices[0] === "number";
  const values = selected.map((value) => choices.indexOf(value));
  const editLabel = `Edit ${
    timeDimension.value ? timeDimension.value.label.toLowerCase() : "value"
  }`;

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
                <input
                  key={idx}
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
          renderThumb={({ props, isDragged }) => (
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
    </>
  );
}
