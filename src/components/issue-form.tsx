import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  issueAtom,
  reloadTasksAtom,
  taskAtom,
  userAtom,
  createTaskFn,
} from "@/helpers/state";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import TaskAssigneesSelect from "./task-assignees-select";
import CommentEdit from "./comment-edit";
import CommentSaveButton from "./comment-save-button";
import IssueCloseButton from "./issue-close-button";
import TagsSelect from "./tags-select";

export default function IssueForm() {
  const [task, setTask] = useAtom(taskAtom);
  const setIssue = useSetAtom(issueAtom);
  const reloadTasks = useSetAtom(reloadTasksAtom);
  const user = useAtomValue(userAtom);

  const [isProcessing, setIsProcessing] = useState(false);

  const updateTaskField = (fieldName: string, value: any) =>
    setTask({ ...task, [fieldName]: value });

  const saveTask = () => {
    setIsProcessing(true);
    const { name, markdown_description, assignees, tags } = task;
    (async () => {
      const getCurrentUser = () => user;
      const setUserFn = () => {}; // Handled by atom
      const refreshToken = async () => false; // Handled by atom

      const res = await createTaskFn(
        {
          name,
          markdown_description,
          assignees: assignees.map(({ id }) => id),
          tags: tags.map(({ name }) => name),
          status: "open",
        },
        getCurrentUser,
        setUserFn,
        refreshToken,
      );
      if (res.error) {
        // TODO: Show an error toast.
      } else {
        setIssue(null);
        setTask(null);
      }
      setIsProcessing(false);
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
        value={task.name}
        onChange={(e) => updateTaskField("name", e.target.value)}
      />
      <div className="mb-2">
        <CommentEdit
          cacheKey={null}
          placeholder="Description"
          setValue={(value) => updateTaskField("markdown_description", value)}
          value={task.markdown_description}
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
          text={task.markdown_description}
        />
      </div>
    </div>
  );
}
