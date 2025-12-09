import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  taskAtom,
  taskStatusesAtom,
  updateTaskAtom,
} from "@/helpers/state";
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

export default function StatusSelect({ status }: { status: any }) {
  const task = useAtomValue(taskAtom);
  const updateTask = useSetAtom(updateTaskAtom);
  const taskStatuses = useAtomValue(taskStatusesAtom);

  const [saving, setSaving] = useState(false);

  const statusChoices = taskStatuses?.tasks || [];

  return saving ? (
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
            const isCurrent = choice === status.status;
            return (
              <DropdownMenuItem
                key={choice}
                className="flex justify-between cursor-pointer"
                onSelect={async () => {
                  if (!isCurrent) setSaving(true);
                  await updateTask({
                    status: choice,
                  });
                  setSaving(false);
                }}
              >
                <span className={isCurrent ? "font-bold" : ""}>
                  {toTitleCase(choice)}
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
