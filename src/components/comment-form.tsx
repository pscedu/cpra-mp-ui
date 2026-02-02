import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { createCommentAtom, taskAtom } from "@/helpers/state";
import { markdownToComment } from "@/helpers/clickup";

import CommentEdit from "@/components/comment-edit";
import CommentSaveButton from "./comment-save-button";
import UserAvatar from "@/components/user-avatar";
import AssigneesSelect from "./assignees-select";

export default function CommentForm() {
  const task = useAtomValue(taskAtom);
  const setTask = useSetAtom(taskAtom);
  const createComment = useSetAtom(createCommentAtom);

  const taskId = task.id;
  const cacheKey = `issue-${taskId}-comment-new`;
  const [markdown, setMarkdown] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [assignee, setAssignee] = useState(null);

  const saveComment = () => {
    setIsProcessing(true);
    (async () => {
      const res = await createComment({
        taskId,
        comment: {
          assignee: assignee ? assignee.id : null,
          comment: markdownToComment(markdown),
        },
      });
      if (res.error) {
        // TODO: Display an error toast.
      } else {
        setTask({ ...task, comments: res.comments });
        setMarkdown("");
        setAssignee(null);
      }
      setIsProcessing(false);
    })();
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm my-4">
      <div className="flex items-start gap-2 p-2 bg-accent">
        <UserAvatar size={24} />
        <div className="mt-1 leading-4">
          <span className="font-bold leading-4">Add a comment</span>
        </div>
      </div>
      <div className="p-2">
        <CommentEdit
          cacheKey={cacheKey}
          value={markdown}
          setValue={setMarkdown}
        />
        <div className="flex mt-2 gap-2">
          <AssigneesSelect
            isMulti={false}
            menuPlacement="top"
            value={assignee === null ? [] : [assignee]}
            onChange={(user) => setAssignee(user)}
          />
          <CommentSaveButton
            onClick={saveComment}
            processing={isProcessing}
            text={markdown}
          />
        </div>
      </div>
    </div>
  );
}
