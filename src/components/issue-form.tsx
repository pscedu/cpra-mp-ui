import { batch } from "@preact/signals-react";
import { usePortalState } from "@/helpers/state";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import IssueCloseButton from "./issue-close-button";
import TagsSelect from "./tags-select";
import AssigneesSelect from "./assignees-select";

export default function IssueForm() {
  const { createTask, issue, reloadTasks, task } = usePortalState();

  const changeHandler = (fieldName: string) => (e) =>
    (task.value = { ...task.value, [fieldName]: e.target.value });

  const saveTask = () => {
    const { name, description, assignees, tags, saveUrl } = task.value;
    (async () => {
      await createTask({
        name,
        description,
        assignees: assignees.map(({ value }) => value.id),
        tags: tags.map(({ value }) => value),
        status: "open",
      });
      batch(() => {
        issue.value = null;
        task.value = null;
      });
      reloadTasks();
    })();
  };

  return (
    <div className="mx-4">
      <div className="flex items-start justify-between">
        <h2 className="font-bold mb-2 text-2xl">New Issue</h2>
        <IssueCloseButton />
      </div>
      <Input
        type="text"
        id="title"
        placeholder="Title"
        className="mb-4"
        value={task.value.name}
        onChange={changeHandler("name")}
      />
      <Textarea
        id="description"
        placeholder="Description"
        className="h-50 mb-4"
        value={task.value.description}
        onChange={changeHandler("description")}
      />
      <TagsSelect />
      <AssigneesSelect />
      <div className="items-top flex space-x-2 mb-4">
        <Checkbox
          id="saveUrl"
          checked={task.value.saveUrl}
          onCheckedChange={(saveUrl) =>
            (task.value = { ...task.value, saveUrl })
          }
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="saveUrl"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Save map and chart
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <IssueCloseButton variant="outline">Cancel</IssueCloseButton>
        <Button
          className="cursor-pointer bg-green-700 hover:bg-green-600 text-white font-bold"
          onClick={saveTask}
        >
          Create
        </Button>
      </div>
    </div>
  );
}
