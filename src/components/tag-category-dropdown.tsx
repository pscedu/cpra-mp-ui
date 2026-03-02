import { useAtom, useAtomValue } from "jotai";
import { tagOptionsAtom, taskAtom } from "@/helpers/state";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { ChevronDown, TriangleAlert } from "lucide-react";

export default function TagCategoryDropdown({
  category,
  label,
}: {
  category: string;
  label: string;
}) {
  const [task, setTask] = useAtom(taskAtom);
  const tagOptions = useAtomValue(tagOptionsAtom);
  const prefix = `${category}:`;
  const assignedTagNames = (task.tags || [])
    .map((tag: { name: string }) => tag.name)
    .filter((name: string) => name.startsWith(prefix));
  const options = tagOptions.filter(
    (option) =>
      option.value.startsWith(prefix) &&
      !assignedTagNames.includes(option.value),
  );
  const missingCategory = assignedTagNames.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={!options.length}
          size="sm"
          className={
            missingCategory
              ? "border-yellow-700! hover:border-yellow-600! group/button"
              : ""
          }
        >
          {missingCategory && (
            <TriangleAlert className="text-yellow-700 group-hover/button:text-yellow-600" />
          )}{" "}
          {label} <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Select a{"aeiou".includes(label[0].toLowerCase()) ? "n" : ""} {label}
        </DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuItem
            onClick={() =>
              setTask({ ...task, tags: [...task.tags, { name: option.value }] })
            }
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
