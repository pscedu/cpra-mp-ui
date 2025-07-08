import { usePortalState } from "@/helpers/state";

import AssigneesSelect from "@/components/assignees-select";

export default function TaskAssigneesSelect() {
  const { task } = usePortalState();

  return (
    <AssigneesSelect
      className="mb-4"
      value={task.value.assignees}
      onChange={(users) =>
        (task.value = {
          ...task.value,
          assignees: users,
        })
      }
    />
  );
}
