import { usePortalState } from "@/helpers/state";
import { markdownToComment } from "@/helpers/clickup";
import { batch, useSignal } from "@preact/signals-react";

import CommentEdit from "@/components/comment-edit";
import CommentSaveButton from "./comment-save-button";
import UserAvatar from "@/components/user-avatar";
import AssigneesSelect from "./assignees-select";

export default function CommentForm() {
  const { createComment, task } = usePortalState();
  const taskId = task.value.id;
  const cacheKey = `issue-${taskId}-comment-new`;
  const markdown = useSignal("");
  const isProcessing = useSignal(false);
  const assignee = useSignal(null);

  const saveComment = () => {
    isProcessing.value = true;
    (async () => {
      const res = await createComment(taskId, {
        assignee: assignee.value ? assignee.value.id : null,
        comment: markdownToComment(markdown.value),
      });
      batch(() => {
        if (res.error) {
          // TODO: Display an error toast.
        } else {
          task.value = { ...task.value, comments: res.comments };
          markdown.value = "";
          assignee.value = null;
        }
        isProcessing.value = false;
      });
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
          value={markdown.value}
          setValue={(value) => (markdown.value = value)}
        />
        <div className="flex mt-2 gap-2">
          <AssigneesSelect
            isMulti={false}
            menuPlacement="top"
            value={assignee.value === null ? [] : [assignee.value]}
            onChange={(user) => (assignee.value = user)}
          />
          <CommentSaveButton
            onClick={saveComment}
            processing={isProcessing.value}
            text={markdown.value}
          />
        </div>
      </div>
    </div>
  );
}
