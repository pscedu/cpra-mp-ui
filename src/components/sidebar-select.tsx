import { useEffect } from "react";
import { useSignal } from "@preact/signals-react";
import { cn } from "@/lib/utils";

import RSelect from "@/components/ui/rselect";
import { SelectionModeDropdown } from "./selection-mode-dropdown";

export default function SidebarSelect({
  className = "",
  id,
  label,
  onChange = null,
  options,
  signal = null,
  supportsSubtract = false,
  value: explicitValue = null,
  ...rest
}) {
  const valueOrValues = explicitValue !== null ? explicitValue : signal.value;
  const supportsMulti = Array.isArray(valueOrValues);
  const values = supportsMulti ? valueOrValues : [valueOrValues];
  const maxLength = useSignal(values.length === 1 ? 1 : Infinity);
  const isMulti = maxLength.value > 1;
  const changeHandler = onChange || ((value) => (signal.value = value));

  useEffect(() => {
    if (values.length > maxLength.value) {
      const newValues = values.slice(0, maxLength.value);
      changeHandler(supportsMulti ? newValues : newValues[0]);
    }
  }, [maxLength.value]);

  return (
    <div className="flex" title={label}>
      <RSelect
        className={cn(`w-84 mb-2 ${className}`)}
        isDisabled={options.length === 1}
        inputId={id}
        isClearable={false}
        isMulti={isMulti}
        isOptionDisabled={() => isMulti && values.length >= maxLength.value}
        menuPlacement="auto"
        onChange={(selectedOptions) => {
          const selectedValues = Array.isArray(selectedOptions)
            ? selectedOptions.map((option) => option.value)
            : [selectedOptions.value];
          changeHandler(
            supportsMulti
              ? selectedValues.slice(0, maxLength.value)
              : selectedValues[0],
          );
        }}
        options={options}
        placeholder={`Select ${label.toLowerCase()}...`}
        value={
          isMulti
            ? options.filter((option) => values.includes(option.value))
            : options.find((option) => option.value === values[0])
        }
        {...rest}
      />
      {supportsMulti && (
        <SelectionModeDropdown
          className="ml-2"
          dimensionLabel={label}
          dimensionName={id}
          maxLength={maxLength.value}
          optionsLength={options.length}
          setMaxLength={(value) => (maxLength.value = value)}
          supportsSubtract={supportsSubtract}
          supportsConcatenate={false}
        />
      )}
    </div>
  );
}
