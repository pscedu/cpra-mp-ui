import { useRef } from "react";
import { toTitleCase } from "@/helpers/utils";
import { batch, useSignal } from "@preact/signals-react";
import { usePortalState } from "@/helpers/state";

import AssigneesSelect from "./assignees-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import CommentEdit from "@/components/comment-edit";
import CommentText from "@/components/comment-text";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, EllipsisVertical, LoaderCircle, Pencil, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import UserAvatar from "@/components/user-avatar";
import RelativeTime from "@/components/relative-time";
import { commentToMarkdown, markdownToComment } from "@/helpers/clickup";

export default function Comment({
  action = "commented",
  assignee: assigneeUser = null,
  comment,
  date,
  id = null,
  resolved,
  user,
}) {
  const { task, updateComment, updateTask, user: authUser } = usePortalState();
  const initialMarkdown = useRef("");
  const markdown = useSignal("");
  const assignee = useSignal(assigneeUser || null);
  const isEditing = useSignal(false);
  const isProcessing = useSignal(false);

  const fullName = user.fullName || user.username;
  const taskId = task.value.id;
  const cacheSuffix = id ? `comment-${id}` : "description";
  const cacheKey = `issue-${taskId}-${cacheSuffix}`;

  const startEditing = () => {
    batch(() => {
      const md = commentToMarkdown(comment);
      initialMarkdown.current = md;
      markdown.value = md;
      isEditing.value = true;
    });
  };

  const cancelEditing = () =>
    batch(() => {
      markdown.value = "";
      assignee.value = assigneeUser;
      initialMarkdown.current = "";
      isEditing.value = false;
      localStorage.removeItem(cacheKey);
    });

  const saveComment = () => {
    isProcessing.value = true;
    (async () => {
      let res;
      if (id) {
        res = await updateComment(id, {
          assignee: assignee.value ? assignee.value.id : null,
          comment: markdownToComment(markdown.value),
        });
      } else {
        res = await updateTask({ markdown_description: markdown.value });
      }
      batch(() => {
        if (res.error) {
          // TODO: Display an error toast.
          markdown.value = "";
          assignee.value = assigneeUser;
          initialMarkdown.current = "";
        } else {
          task.value = {
            ...task.value,
            comments: task.value.comments.map((comment) => ({
              ...comment,
              comment:
                id === comment.id
                  ? markdownToComment(markdown.value)
                  : comment.comment,
              assignee: id === comment.id ? assignee.value : comment.assignee,
            })),
            markdownDescription: id
              ? task.value.markdownDescription
              : markdown.value,
          };
        }
        isEditing.value = false;
        isProcessing.value = false;
      });
    })();
  };

  const saveResolved = (checked) => {
    isProcessing.value = true;
    (async () => {
      const res = await updateComment(id, {
        resolved: checked,
      });
      batch(() => {
        if (res.error) {
          // TODO: Display an error toast.
        } else {
          task.value = {
            ...task.value,
            comments: task.value.comments.map((comment) => ({
              ...comment,
              resolved: id === comment.id ? checked : comment.resolved,
            })),
          };
        }
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
                  onSelect={startEditing}
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
          <>
            <CommentEdit
              cacheKey={cacheKey}
              defaultValue={initialMarkdown.current}
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
              <div className="flex-none">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={saveComment}
                  disabled={markdown.value.length == 0 || isProcessing.value}
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
                  onClick={cancelEditing}
                  className="cursor-pointer"
                  aria-label="Cancel"
                  title="Cancel"
                >
                  <X />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <CommentText comment={comment} />
        )}
      </div>
      {assignee.value && authUser.value && !isEditing.value && (
        <div
          className={`rounded-b-lg p-2 flex items-center gap-3 ${resolved ? " bg-green-200 dark:bg-green-950" : assignee.value.username === authUser.value.username ? " bg-purple-200 dark:bg-purple-950" : "bg-blue-200 dark:bg-blue-950"}`}
        >
          {isProcessing.value ? (
            <LoaderCircle className="animate-spin" size={16} />
          ) : (
            <>
              <Checkbox
                id={`comment-${id}-resolved`}
                checked={resolved}
                onCheckedChange={saveResolved}
                className="bg-accent"
              />
              <Label
                htmlFor={`comment-${id}-resolved`}
                className={resolved ? "line-through" : ""}
              >
                Assigned to <strong>{assignee.value.fullName}</strong>
              </Label>
            </>
          )}
        </div>
      )}
    </div>
  );
}
