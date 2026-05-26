import { useAtomValue, useAtom, useSetAtom } from "jotai";
import {
  catalogQueriesAtom,
  requestedTimeValuesAtom,
  setSelectedFilterChoicesAtom,
} from "@/helpers/state";
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

let selectedTimeout: ReturnType<typeof setTimeout> | null = null;

import { SelectionModeDropdown } from "./selection-mode-dropdown";
import { Slider } from "./ui/slider";

export default function TimeSelect({
  showSelectionMode = true,
}: {
  showSelectionMode?: boolean;
}) {
  const setSelectedFilterChoices = useSetAtom(setSelectedFilterChoicesAtom);
  const catalogQueries = useAtomValue(catalogQueriesAtom);
  const mapCatalogQuery = catalogQueries.getMapCatalogQuery();
  const timeDimension = catalogQueries.getTimeDimension();
  const [selected, setSelected] = useAtom(requestedTimeValuesAtom);
  const choices = catalogQueries.getTimeChoices();

  if (!choices.length || !selected.length) return;

  const setSelectedWithDebounce = (values, useTimeout = true) => {
    setSelected(values);

    if (selectedTimeout) clearTimeout(selectedTimeout);

    const updateFilters = () => {
      setSelectedFilterChoices(timeDimension.name, values, true);
    };

    if (useTimeout) {
      selectedTimeout = setTimeout(updateFilters, 250);
    } else {
      updateFilters();
    }
  };

  const isYear = typeof choices[0] === "number";
  const values = selected.map((value) => choices.indexOf(value));
  const label = timeDimension ? timeDimension?.label : "Value";
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
                      const newValue = parseInt(e.target);
                      if (choices.includes(newValue)) {
                        const newSelected = [...selected];
                        newSelected[idx] = newValue;
                        setSelected(newSelected);
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
                    setSelectedWithDebounce(newSelected);
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
            setSelectedWithDebounce(idxs.map((idx) => choices[idx]))
          }
        />
      </div>
      {showSelectionMode && (
        <SelectionModeDropdown
          dimensionName={timeDimension?.name}
          dimensionLabel={label}
          maxLength={values.length}
          optionsLength={choices.length}
          setMaxLength={(ml) => {
            const newLength = Math.min(ml, 2);
            if (newLength > values.length) {
              const newValues = values.slice();
              if (values[0] === choices.length - 1) newValues.splice(0, 0, 0);
              else newValues.push(choices.length - 1);
              setSelectedWithDebounce(
                newValues.map((idx) => choices[idx]),
                false,
              );
            } else if (newLength < values.length) {
              setSelectedWithDebounce([choices[values[0]]], false);
            }
          }}
          supportsConcatenate={
            mapCatalogQuery?.dataset?.variable?.name === "lnd_type"
          }
          supportsSubtract={true}
        />
      )}
    </>
  );
}
