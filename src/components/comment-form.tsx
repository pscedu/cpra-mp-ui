import { usePortalState } from "@/helpers/state";
import { batch, useSignal } from "@preact/signals-react";

import { Button } from "@/components/ui/button";
import CommentEdit from "@/components/comment-edit";
import { LoaderCircle } from "lucide-react";
import UserAvatar from "@/components/user-avatar";

export default function CommentForm() {
  const { createComment, task } = usePortalState();
  const taskId = task.value.id;
  const cacheKey = `issue-${taskId}-new-comment`;
  const text = useSignal("");
  const isProcessing = useSignal(false);

  const saveComment = () => {
    isProcessing.value = true;
    (async () => {
      const res = await createComment(taskId, text.value);
      batch(() => {
        if (res.error) {
          // TODO: Display an error toast.
        } else {
          task.value = { ...task.value, comments: res.comments };
          text.value = "";
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
          value={text.value}
          setValue={(value) => (text.value = value)}
        >
          <Button
            className="cursor-pointer bg-green-700 hover:bg-green-600 text-white font-bold"
            onClick={saveComment}
            disabled={text.value.length == 0 || isProcessing.value}
          >
            {isProcessing.value ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <>Comment</>
            )}
          </Button>
        </CommentEdit>
      </div>
    </div>
  );
}
