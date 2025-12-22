import { useAtom } from "jotai";
import { taskAtom } from "@/helpers/state";

import AssigneesSelect from "@/components/assignees-select";

export default function TaskAssigneesSelect() {
  const [task, setTask] = useAtom(taskAtom);

  return (
    <AssigneesSelect
      className="mb-4"
      value={task?.assignees}
      onChange={(selected: any) =>
        setTask({
          ...task,
          assignees: selected.map((option) => option.value),
        })
      }
    />
  );
}
