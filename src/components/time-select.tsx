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

import { SelectionModeDropdown } from "./selection-mode-dropdown";
import { Slider } from "./ui/slider";

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
            className={cn(
              `${values.length > 1 && !isYear ? "w-[230px]" : "w-[140px]"} justify-start text-left font-normal`,
            )}
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
            selected.map((value, i) => {
              const date = parseDate(value);
              return (
                <Calendar
                  key={i}
                  mode="single"
                  selected={date}
                  defaultMonth={date}
                  onSelect={(newDate) => {
                    const newSelected = [...selected];
                    newSelected[i] = (newDate || date)
                      .toISOString()
                      .split("T")[0];
                    setTimeValues(newSelected);
                  }}
                  disabled={(date) =>
                    !choices.includes(date.toISOString().split("T")[0])
                  }
                  initialFocus={i === 0}
                />
              );
            })
          )}
        </PopoverContent>
      </Popover>
      {/* Time slider */}
      <div className="w-full px-4">
        <Slider
          step={1}
          disabled={choices.length < 2}
          min={0}
          max={choices.length > 1 ? choices.length - 1 : 1}
          value={values}
          onValueChange={(idxs) =>
            setTimeValues(idxs.map((idx) => choices[idx]))
          }
        />
      </div>
      <SelectionModeDropdown
        dimensionName={timeDimension.value.name}
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
