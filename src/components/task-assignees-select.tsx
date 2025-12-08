import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";

// State atoms
const task = useAtomValue(atoms.taskAtom);

import AssigneesSelect from "@/components/assignees-select";

export default function TaskAssigneesSelect() {
  

  return (
    <AssigneesSelect
      className="mb-4"
      value={task?.assignees}
      onChange={(users) =>
        (task = {
          ...task,
          assignees: users,
        })
      }
    />
  );
}
