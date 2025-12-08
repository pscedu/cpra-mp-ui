import { useEffect } from "react";
import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";

import { Input } from "@/components/ui/input";
import TaskAssigneesSelect from "./task-assignees-select";
import CommentEdit from "./comment-edit";
import CommentSaveButton from "./comment-save-button";
import IssueCloseButton from "./issue-close-button";
import TagsSelect from "./tags-select";

export default function IssueForm() {
  const createTask = useAtomValue(atoms.createTaskAtom);
  const issue = useAtomValue(atoms.issueAtom);
  const mapCatalogQuery = useAtomValue(atoms.mapCatalogQueryAtom);
  const reloadTasks = useAtomValue(atoms.reloadTasksAtom);
  const tagOptions = useAtomValue(atoms.tagOptionsAtom);
  const task = useAtomValue(atoms.taskAtom);
    const isProcessing = useSignal(false);

  useEffect(() => {
    // Update the issue tags to match the current dataset and filters.
    const query = mapCatalogQuery;
    if (!query || !tagOptions) return;
    const wantedTags = [];
    for (const dimensionName of Object.keys(query.response.results))
      for (const dimensionValue of query.response.results[dimensionName])
        wantedTags.push(`${dimensionName}:${dimensionValue.toString()}`);
    const tags = tagOptions
      .filter((tag) => wantedTags.includes(tag))
      .map((tag) => ({ name: tag }));
    if (tags.length) task = { ...task, tags };
  }, [mapCatalogQuery, tagOptions]);

  const updateTaskField = (fieldName: string, value: any) =>
    (task = { ...task, [fieldName]: value });

  const saveTask = () => {
    isProcessing = true;
    const { name, markdown_description, assignees, tags } = task;
    (async () => {
      const res = await createTask({
        name,
        markdown_description,
        assignees: assignees.map(({ id }) => id),
        tags: tags.map(({ name }) => name),
        status: "open",
      });
      batch(() => {
        if (res.error) {
          // TODO: Show an error toast.
        } else {
          issue = null;
          task = null;
        }
        isProcessing = false;
        reloadTasks();
      });
    })();
  };

  return (
    <div className="mx-4">
      <div className="flex items-start justify-between">
        <h2 className="font-bold mb-2 text-2xl">New Observation</h2>
        <IssueCloseButton />
      </div>
      <Input
        type="text"
        id="title"
        placeholder="Title"
        className="mb-4"
        value={task?.name}
        onChange={(e) => updateTaskField("name", e.target)}
      />
      <div className="mb-2">
        <CommentEdit
          cacheKey={null}
          placeholder="Description"
          setValue={(value) => updateTaskField("markdown_description", value)}
          value={task?.markdown_description}
        />
      </div>
      <TagsSelect />
      <TaskAssigneesSelect />
      <div className="flex justify-end gap-2">
        <IssueCloseButton variant="outline">Cancel</IssueCloseButton>
        <CommentSaveButton
          buttonLabel="Create"
          fieldLabel="task description"
          onClick={saveTask}
          processing={isProcessing}
          text={task?.markdown_description}
        />
      </div>
    </div>
  );
}
