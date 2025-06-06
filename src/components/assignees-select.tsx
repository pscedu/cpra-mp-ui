import { usePortalState } from "@/helpers/state";

import RSelect from "@/components/ui/rselect";

export default function AssigneesSelect() {
  const { users, task } = usePortalState();

  const optionsMap = {};
  for (let user of users.value)
    optionsMap[user.id] = {
      value: user,
      label: user.fullName,
    };

  return (
    <RSelect
      inputId="assignedTo"
      options={Object.values(optionsMap)}
      isMulti={true}
      isClearable={true}
      className="mb-4 w-full"
      placeholder="Assigned to..."
      value={task.value.assignees.map((user) => optionsMap[user.id])}
      onChange={(selected) =>
        (task.value = {
          ...task.value,
          assignees: selected.map((option) => option.value),
        })
      }
    />
  );
}
