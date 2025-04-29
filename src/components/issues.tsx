import { usePortalState } from "@/helpers/state";

import { LoaderCircle } from "lucide-react";
import Issue from "@/components/issue";
import RSelect from "@/components/ui/rselect";
import { Button } from "@/components/ui/button";

export default function Issues() {
  const { issue, issueFilterTags, tagOptions, tasks } = usePortalState();

  if (tasks.value === null)
    return (
      <li className="p-4 flex">
        <LoaderCircle className="animate-spin" />
      </li>
    );

  return (
    <>
      <div className="flex mx-4 mb-2 mt-1 gap-4">
        <RSelect
          inputId="tags"
          options={tagOptions.value}
          isMulti={true}
          isClearable={true}
          className="w-full"
          placeholder="Filter by tag..."
          value={issueFilterTags.value}
          onChange={(selected) => (issueFilterTags.value = selected)}
        />
        <Button
          className="cursor-pointer bg-green-700 hover:bg-green-600 text-white font-bold"
          onClick={() => (issue.value = "new")}
        >
          New Issue
        </Button>
      </div>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm mx-4">
        {tasks.value.length > 0 && (
          <ul className="divide-y">
            {tasks.value.map((task) => (
              <Issue key={task.id} task={task} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
