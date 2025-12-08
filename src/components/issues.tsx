import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";

// State atoms
const issue = useAtomValue(atoms.issueAtom);
const issueFilterTags = useAtomValue(atoms.issueFilterTagsAtom);
const tagOptions = useAtomValue(atoms.tagOptionsAtom);
const tasks = useAtomValue(atoms.tasksAtom);

import { LoaderCircle } from "lucide-react";
import Issue from "@/components/issue";
import RSelect from "@/components/ui/rselect";
import { Button } from "@/components/ui/button";

export default function Issues() {
  

  if (tasks === null)
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
          options={tagOptions}
          isMulti={true}
          isClearable={true}
          className="w-full"
          placeholder="Filter by tag..."
          value={issueFilterTags}
          onChange={(selected) => (issueFilterTags = selected)}
        />
        <Button
          className="cursor-pointer bg-green-700 hover:bg-green-600 text-white font-bold"
          onClick={() => (issue = "new")}
        >
          New Observation
        </Button>
      </div>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm mx-4">
        {tasks?.length > 0 && (
          <ul className="divide-y">
            {tasks?.map((task) => (
              <Issue key={task.id} task={task} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
