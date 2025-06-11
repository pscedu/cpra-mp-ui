import { toTitleCase } from "@/helpers/utils";
import { batch, useSignal } from "@preact/signals-react";
import { usePortalState } from "@/helpers/state";

import { Button } from "@/components/ui/button";
import CommentEdit from "@/components/comment-edit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, EllipsisVertical, LoaderCircle, Pencil, X } from "lucide-react";
import UserAvatar from "@/components/user-avatar";
import RelativeTime from "@/components/relative-time";

export default function Comment({
  user,
  action = "commented",
  date,
  id = null,
  commentText,
}) {
  const { task, updateComment, updateTask, user: authUser } = usePortalState();
  const text = useSignal(commentText);
  const isEditing = useSignal(false);
  const isProcessing = useSignal(false);

  const fullName = user.fullName || user.username;
  const taskId = task.value.id;
  const cacheSuffix = id ? `comment-${id}` : "description";
  const cacheKey = `issue-${taskId}-${cacheSuffix}`;

  const saveComment = () => {
    isProcessing.value = true;
    (async () => {
      let res;
      if (id) {
        res = await updateComment(id, { commentText: text.value });
      } else {
        res = await updateTask({ description: text.value });
      }
      batch(() => {
        if (res.error) {
          // TODO: Display an error toast.
          text.value = commentText;
        } else {
          task.value = {
            ...task.value,
            comments: task.value.comments.map((comment) => ({
              ...comment,
              commentText: id === comment.id ? text.value : comment.commentText,
            })),
            desciption: id ? task.value.desciption : text.value,
          };
        }
        isEditing.value = false;
        isProcessing.value = false;
      });
    })();
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm my-4 divide-y">
      <div className="flex justify-between p-2 bg-accent">
        <div className="flex items-center gap-2">
          <UserAvatar size={24} user={{ fullName, email: user.email }} />
          <div className="mt-1 leading-4">
            <span className="font-bold leading-4">{fullName}</span> {action}{" "}
            <RelativeTime
              className="text-sm text-muted-foreground leading-4 whitespace-nowrap"
              date={new Date(parseInt(date))}
              label={toTitleCase(action)}
            />
          </div>
        </div>
        {user.id === authUser.value.id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="cursor-pointer">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={isEditing.value || isProcessing.value}
                  onSelect={() => (isEditing.value = true)}
                >
                  <Pencil />
                  Edit comment
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="p-2">
        {isEditing.value ? (
          <CommentEdit
            cacheKey={cacheKey}
            defaultValue={commentText}
            value={text.value}
            setValue={(value) => (text.value = value)}
          >
            <div>
              <Button
                variant="ghost"
                size="icon"
                onClick={saveComment}
                disabled={text.value.length == 0 || isProcessing.value}
                className="cursor-pointer"
                aria-label="Save"
                title="Save"
              >
                {isProcessing.value ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Check />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  batch(() => {
                    text.value = commentText;
                    isEditing.value = false;
                    localStorage.removeItem(cacheKey);
                  })
                }
                className="cursor-pointer"
                aria-label="Cancel"
                title="Cancel"
              >
                <X />
              </Button>
            </div>
          </CommentEdit>
        ) : (
          text.value
        )}
      </div>
    </div>
  );
}
