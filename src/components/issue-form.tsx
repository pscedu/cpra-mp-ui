import { usePortalState } from "@/helpers/state";
import { batch, useSignal } from "@preact/signals-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle } from "lucide-react";
import AssigneesSelect from "./assignees-select";
import CommentEdit from "./comment-edit";
import IssueCloseButton from "./issue-close-button";
import TagsSelect from "./tags-select";

export default function IssueForm() {
  const { createTask, issue, reloadTasks, task } = usePortalState();
  const isProcessing = useSignal(false);

  const updateTaskField = (fieldName: string, value: any) =>
    (task.value = { ...task.value, [fieldName]: value });

  const saveTask = () => {
    isProcessing.value = true;
    const { name, description, assignees, tags } = task.value;
    (async () => {
      const res = await createTask({
        name,
        description,
        assignees: assignees.map(({ id }) => id),
        tags: tags.map(({ name }) => name),
        status: "open",
      });
      batch(() => {
        if (res.error) {
          // TODO: Show an error toast.
        } else {
          issue.value = null;
          task.value = null;
        }
        isProcessing.value = false;
        reloadTasks();
      });
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
        onChange={(e) => updateTaskField("name", e.target.value)}
      />
      <div className="mb-2">
        <CommentEdit
          cacheKey={null}
          placeholder="Description"
          setValue={(value) => updateTaskField("description", value)}
          value={task.value.description}
        />
      </div>
      <TagsSelect />
      <AssigneesSelect />
      <div className="flex justify-end gap-2">
        <IssueCloseButton variant="outline">Cancel</IssueCloseButton>
        <Button
          className="cursor-pointer bg-green-700 hover:bg-green-600 text-white font-bold"
          onClick={saveTask}
          disabled={isProcessing.value}
        >
          {isProcessing.value ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <>Create</>
          )}
        </Button>
      </div>
    </div>
  );
}
