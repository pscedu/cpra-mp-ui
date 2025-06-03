import { usePortalState } from "@/helpers/state";
import { toTitleCase } from "@/helpers/utils";

import { Check, LoaderCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusToken from "@/components/status-token";
import { batch, useSignal } from "@preact/signals-react";

const statusChoices = [
  {
    type: "open",
    status: "Open",
  },
  { type: "done", status: "wontfix" },
  { type: "closed", status: "resolved" },
];

export default function StatusSelect({ status }) {
  const { task, updateTask } = usePortalState();
  const saving = useSignal(false);

  return saving.value ? (
    <LoaderCircle className="animate-spin mb-6 me-2" />
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="mb-4 me-2 cursor-pointer">
          <StatusToken {...status} caret={true} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel>Issue Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {statusChoices.map((choice) => {
            const isCurrent = choice.status === status.status;
            return (
              <DropdownMenuItem
                key={choice.type}
                className="flex justify-between cursor-pointer"
                onSelect={() => {
                  if (!isCurrent) saving.value = true;
                  (async () => {
                    const res = await updateTask(task.value.id, {
                      status: choice.status,
                    });
                    batch(() => {
                      if (res.error) return console.error(res.error);
                      else task.value = { ...task.value, status: res.status };
                      saving.value = false;
                    });
                  })();
                }}
              >
                <span className={isCurrent ? "font-bold" : ""}>
                  {toTitleCase(choice.status)}
                </span>
                {isCurrent && <Check />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
