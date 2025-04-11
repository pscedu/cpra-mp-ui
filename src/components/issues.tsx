import { useSignal, useSignalEffect } from "@preact/signals-react";
import { usePortalState } from "@/helpers/state";

import Issue from "@/components/issue";

export default function Issues() {
  const { getTasks } = usePortalState();
  const tasks = useSignal(null);
  useSignalEffect(() => {
    (async () => {
      tasks.value = await getTasks();
    })();
  });

  if (tasks.value !== null)
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm mx-4">
        {tasks.value.length > 0 && (
          <ul className="divide-y">
            {tasks.value.map((task) => (
              <Issue key={task.id} task={task} />
            ))}
          </ul>
        )}
      </div>
    );
}
