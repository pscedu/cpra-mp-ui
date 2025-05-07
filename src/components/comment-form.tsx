import { batch, useSignal, useSignalEffect } from "@preact/signals-react";
import { usePortalState } from "@/helpers/state";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/user-avatar";

export default function CommentForm() {
  const { createComment, issue, reloadTask } = usePortalState();
  const commentKey = `issue-${issue.value}-comment`;
  const saveUrlKey = `issue-${issue.value}-save-url`;
  const comment = useSignal(localStorage.getItem(commentKey) || "");
  const saveUrl = useSignal(localStorage.getItem(saveUrlKey) !== "false");

  useSignalEffect(() => {
    if (comment.value.length) localStorage.setItem(commentKey, comment.value);
    else localStorage.removeItem(commentKey);
  });

  useSignalEffect(() => {
    if (saveUrl.value) localStorage.removeItem(saveUrlKey);
    else localStorage.setItem(saveUrlKey, "false");
  });

  const saveComment = () => {
    (async () => {
      await createComment(issue.value, comment.value);
      // TODO: Make sure save succeeded before clearing local storage.
      batch(() => {
        comment.value = "";
        saveUrl.value = true;
      });
      reloadTask();
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
        <Textarea
          id="comment"
          placeholder="Add your comment..."
          className="h-50 mb-2"
          value={comment.value}
          onChange={(e) => (comment.value = e.target.value)}
        />
        <div className="flex justify-between items-center">
          <div className="items-top flex space-x-2">
            <Checkbox
              id="saveUrl"
              checked={saveUrl.value}
              onCheckedChange={(checked) => (saveUrl.value = checked)}
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
          <Button
            className="cursor-pointer bg-green-700 hover:bg-green-600 text-white font-bold"
            onClick={saveComment}
            disabled={comment.value.length == 0}
          >
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
