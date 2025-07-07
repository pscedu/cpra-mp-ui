import { usePortalState } from "@/helpers/state";
import { markdownToComment } from "@/helpers/clickup";
import { batch, useSignal } from "@preact/signals-react";

import CommentEdit from "@/components/comment-edit";
import CommentSaveButton from "./comment-save-button";
import UserAvatar from "@/components/user-avatar";

export default function CommentForm() {
  const { createComment, task } = usePortalState();
  const taskId = task.value.id;
  const cacheKey = `issue-${taskId}-comment-new`;
  const markdown = useSignal("");
  const isProcessing = useSignal(false);

  const saveComment = () => {
    isProcessing.value = true;
    (async () => {
      const res = await createComment(
        taskId,
        markdownToComment(markdown.value),
      );
      batch(() => {
        if (res.error) {
          // TODO: Display an error toast.
        } else {
          task.value = { ...task.value, comments: res.comments };
          markdown.value = "";
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
        >
          <CommentSaveButton
            onClick={saveComment}
            processing={isProcessing.value}
            text={markdown.value}
          />
        </CommentEdit>
      </div>
    </div>
  );
}
