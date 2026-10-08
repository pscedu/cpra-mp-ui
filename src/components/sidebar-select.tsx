import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

import RSelect from "@/components/ui/rselect";
import { SelectionModeDropdown } from "./selection-mode-dropdown";

export default function SidebarSelect({
  className = "",
  id,
  label,
  onChange,
  options,
  // Pre-grouped alternative to `options` (e.g. plain variables alongside a
  // "Derived Variables" group in the Variable dropdown, §4.1). When given,
  // `options` is ignored for rendering/lookup purposes -- the flattened
  // union of every group's options is used instead.
  optionGroups,
  showSelectionMode = true,
  supportsSubtract = false,
  value: explicitValue,
  ...rest
}) {
  const flatOptions = optionGroups
    ? optionGroups.flatMap((group) => group.options)
    : options;
  const valueOrValues = explicitValue;
  const supportsMulti = Array.isArray(valueOrValues);
  const values = supportsMulti ? valueOrValues : [valueOrValues];
  const [maxLength, setMaxLength] = useState(
    values.length === 1 ? 1 : Infinity,
  );
  const isMulti = maxLength > 1;

  useEffect(() => {
    if (values.length > maxLength) {
      const newValues = values.slice(0, maxLength);
      onChange(supportsMulti ? newValues : newValues[0]);
    }
  }, [maxLength]);

  return (
    <div className="flex" title={label}>
      <RSelect
        className={cn(`w-84 mb-2 ${className}`)}
        isDisabled={flatOptions.length === 1}
        inputId={id}
        isClearable={false}
        isMulti={isMulti}
        isOptionDisabled={() => isMulti && values.length >= maxLength}
        menuPlacement="auto"
        onChange={(selectedOptions) => {
          const selectedValues = Array.isArray(selectedOptions)
            ? selectedOptions.map((option) => option.value)
            : [selectedOptions.value];
          onChange(
            supportsMulti
              ? selectedValues.slice(0, maxLength)
              : selectedValues[0],
          );
        }}
        options={optionGroups ?? [{ label, options }]}
        placeholder={`Select ${label.toLowerCase()}...`}
        value={
          isMulti
            ? flatOptions.filter((option) => values.includes(option.value))
            : flatOptions.find((option) => option.value === values[0])
        }
        {...rest}
      />
      {showSelectionMode && supportsMulti && (
        <SelectionModeDropdown
          className="ml-2"
          dimensionLabel={label}
          dimensionName={id}
          maxLength={maxLength}
          optionsLength={flatOptions.length}
          setMaxLength={setMaxLength}
          supportsSubtract={supportsSubtract}
        />
      )}
    </div>
  );
}
