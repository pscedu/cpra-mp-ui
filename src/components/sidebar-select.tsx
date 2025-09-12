import { useSignal } from "@preact/signals-react";
import { cn } from "@/lib/utils";

import RSelect from "@/components/ui/rselect";

export default function SidebarSelect({
  className = "",
  label,
  onChange = null,
  options,
  signal = null,
  value: explicitValue = null,
  ...rest
}) {
  const valueOrValues = explicitValue || signal.value;
  const supportsMulti = Array.isArray(valueOrValues);
  const values = supportsMulti ? valueOrValues : [valueOrValues];
  const isMulti = useSignal(values.length > 1);
  const changeHandler = onChange || ((value) => (signal.value = value));

  return (
    <div className="flex">
      <RSelect
        className={cn(`w-full mb-2 ${className}`)}
        inputId={label.toLowerCase().replace(" ", "-")}
        isClearable={false}
        isMulti={isMulti.value}
        menuPlacement="auto"
        onChange={(selectedOptions) => {
          const selectedValues = Array.isArray(selectedOptions)
            ? selectedOptions.map((option) => option.value)
            : [selectedOptions.value];
          changeHandler(supportsMulti ? selectedValues : selectedValues[0]);
        }}
        options={options}
        placeholder={`Select ${label}...`}
        value={
          isMulti.value
            ? options.filter((option) => values.includes(option.value))
            : options.find((option) => option.value === values[0])
        }
        {...rest}
      />
    </div>
  );
}
