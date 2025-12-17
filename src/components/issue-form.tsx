import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom, useAtom } from "jotai";
import {
  createTaskAtom,
  issueAtom,
  catalogQueriesAtom,
  reloadTasksAtom,
  tagOptionsAtom,
  taskAtom,
} from "@/helpers/state";

import { Input } from "@/components/ui/input";
import TaskAssigneesSelect from "./task-assignees-select";
import CommentEdit from "./comment-edit";
import CommentSaveButton from "./comment-save-button";
import IssueCloseButton from "./issue-close-button";
import TagsSelect from "./tags-select";

export default function IssueForm() {
  const createTask = useSetAtom(createTaskAtom);
  const setIssue = useSetAtom(issueAtom);
  const mapCatalogQuery = useAtomValue(catalogQueriesAtom).getMapCatalogQuery();
  const reloadTasks = useSetAtom(reloadTasksAtom);
  const tagOptions = useAtomValue(tagOptionsAtom);
  const [task, setTask] = useAtom(taskAtom);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Update the issue tags to match the current dataset and filters.
    const query = mapCatalogQuery;
    if (!query || !tagOptions || !task) return;
    const wantedTags = [];
    for (const dimensionName of Object.keys(query.response.results))
      for (const dimensionValue of query.response.results[dimensionName])
        wantedTags.push(`${dimensionName}:${dimensionValue.toString()}`);
    const tags = tagOptions
      .filter((tag: string) => wantedTags.includes(tag))
      .map((tag: string) => ({ name: tag }));
    if (tags.length) setTask({ ...task, tags });
  }, [mapCatalogQuery, tagOptions]);

  const updateTaskField = (fieldName: string, value: any) =>
    setTask({ ...task, [fieldName]: value });

  const saveTask = async () => {
    setIsProcessing(true);
    const { name, markdown_description, assignees, tags } = task;
    await createTask({
      name,
      markdown_description,
      assignees: assignees.map(({ id }: any) => id),
      tags: tags.map(({ name }: any) => name),
      status: "open",
    });
    setIssue(null);
    setTask(null);
    setIsProcessing(false);
    reloadTasks();
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
        onChange={(e) => updateTaskField("name", e.target.value)}
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
