import { useRef, useState } from "react";
import { toTitleCase } from "@/helpers/utils";
import { useAtomValue, useSetAtom } from "jotai";
import {
  taskAtom,
  updateCommentAtom,
  updateTaskAtom,
  userAtom,
} from "@/helpers/state";

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
  const task = useAtomValue(taskAtom);
  const setTask = useSetAtom(taskAtom);
  const updateComment = useSetAtom(updateCommentAtom);
  const updateTask = useSetAtom(updateTaskAtom);
  const authUser = useAtomValue(userAtom);

  const initialMarkdown = useRef("");
  const [markdown, setMarkdown] = useState("");
  const [assignee, setAssignee] = useState(assigneeUser || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fullName = user.fullName || user.username;
  const taskId = task.id;
  const cacheSuffix = id ? `comment-${id}` : "description";
  const cacheKey = `issue-${taskId}-${cacheSuffix}`;

  const startEditing = () => {
    const md = commentToMarkdown(comment);
    initialMarkdown.current = md;
    setMarkdown(md);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setMarkdown("");
    setAssignee(assigneeUser);
    initialMarkdown.current = "";
    setIsEditing(false);
    localStorage.removeItem(cacheKey);
  };

  const saveComment = () => {
    setIsProcessing(true);
    (async () => {
      let res;
      if (id) {
        res = await updateComment({
          commentId: id,
          commentUpdates: {
            assignee: assignee ? assignee.id : null,
            comment: markdownToComment(markdown),
          },
        });
      } else {
        res = await updateTask({ markdown_description: markdown });
      }

      if (res.error) {
        // TODO: Display an error toast.
        setMarkdown("");
        setAssignee(assigneeUser);
        initialMarkdown.current = "";
      } else {
        setTask({
          ...task,
          comments: task.comments.map((comment) => ({
            ...comment,
            comment:
              id === comment.id ? markdownToComment(markdown) : comment.comment,
            assignee: id === comment.id ? assignee : comment.assignee,
          })),
          markdownDescription: id ? task.markdownDescription : markdown,
        });
      }
      setIsEditing(false);
      setIsProcessing(false);
    })();
  };

  const saveResolved = (checked) => {
    setIsProcessing(true);
    (async () => {
      const res = await updateComment({
        commentId: id,
        commentUpdates: {
          resolved: checked,
        },
      });

      if (res.error) {
        // TODO: Display an error toast.
      } else {
        setTask({
          ...task,
          comments: task.comments.map((comment) => ({
            ...comment,
            resolved: id === comment.id ? checked : comment.resolved,
          })),
        });
      }
      setIsProcessing(false);
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
        {user.id === authUser.id && (
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
                  disabled={isEditing || isProcessing}
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
        {isEditing ? (
          <>
            <CommentEdit
              cacheKey={cacheKey}
              defaultValue={initialMarkdown.current}
              value={markdown}
              setValue={setMarkdown}
            />
            <div className="flex mt-2 gap-2">
              {id && (
                <AssigneesSelect
                  isMulti={false}
                  menuPlacement="top"
                  value={assignee === null ? [] : [assignee]}
                  onChange={(user) => setAssignee(user)}
                />
              )}
              <div className="flex-none">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={saveComment}
                  disabled={markdown.length == 0 || isProcessing}
                  className="cursor-pointer"
                  aria-label="Save"
                  title="Save"
                >
                  {isProcessing ? (
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
      {assignee && authUser && !isEditing && (
        <div
          className={`rounded-b-lg p-2 flex items-center gap-3 ${resolved ? " bg-green-200 dark:bg-green-950" : assignee.username === authUser.username ? " bg-purple-200 dark:bg-purple-950" : "bg-blue-200 dark:bg-blue-950"}`}
        >
          {isProcessing ? (
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
                Assigned to <strong>{assignee.fullName}</strong>
              </Label>
            </>
          )}
        </div>
      )}
    </div>
  );
}
