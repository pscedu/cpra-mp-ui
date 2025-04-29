import { usePortalState } from "@/helpers/state";

import { LoaderCircle } from "lucide-react";
import Issue from "@/components/issue";
import { Button } from "@/components/ui/button";

export default function Issues() {
  const { issue, tasks } = usePortalState();

  if (tasks.value === null)
    return (
      <li className="p-4 flex">
        <LoaderCircle className="animate-spin" />
      </li>
    );

  return (
    <>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm mx-4">
        {tasks.value.length > 0 && (
          <ul className="divide-y">
            {tasks.value.map((task) => (
              <Issue key={task.id} task={task} />
            ))}
          </ul>
        )}
      </div>
      <Button
        className="mx-4 cursor-pointer bg-green-700 hover:bg-green-600 text-white font-bold"
        onClick={() => (issue.value = "new")}
      >
        New Issue
      </Button>
    </>
  );
}
