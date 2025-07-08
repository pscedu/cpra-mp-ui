import { usePortalState } from "@/helpers/state";
import { cn } from "@/lib/utils";

import RSelect from "@/components/ui/rselect";

export default function AssigneesSelect({
  className = "",
  isMulti = true,
  menuPlacement = "auto",
  onChange,
  value,
}: {
  className?: string;
  isMulti?: boolean;
  menuPlacement?: "top" | "bottom" | "auto";
  onChange: (selected: any | any[]) => void;
  value: any | any[];
}) {
  const { users } = usePortalState();

  const optionsMap: { [username: string]: { value: any; label: string } } = {};
  for (let user of users.value)
    if (user.clickupId)
      optionsMap[user.id] = {
        value: user,
        label: user.fullName,
      };

  return (
    <RSelect
      inputId="assignedTo"
      options={Object.values(optionsMap)}
      isMulti={isMulti}
      menuPlacement={menuPlacement}
      isClearable={true}
      className={cn(`w-full ${className}`)}
      placeholder="Assigned to..."
      value={
        Array.isArray(value)
          ? value.map((user) => optionsMap[user.id])
          : value
            ? optionsMap[value.id]
            : null
      }
      onChange={(selected) =>
        onChange(
          Array.isArray(selected)
            ? selected.map((option) => option.value)
            : selected
              ? selected.value
              : null,
        )
      }
    />
  );
}
