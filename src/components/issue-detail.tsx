import { calculateDiff } from "@/helpers/management";
import { useAtom, useSetAtom } from "jotai";
import { taskAtom, updateTaskAtom } from "@/helpers/state";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { buttonVariants } from "./ui/button";

import { ExternalLink, LoaderCircle } from "lucide-react";
import TaskAssigneesSelect from "./task-assignees-select";
import Comment from "./comment";
import CommentForm from "./comment-form";
import EditToggle from "./edit-toggle";
import IssueCloseButton from "./issue-close-button";
import StatusSelect from "./status-select";
import TagToken from "./tag-token";
import TagsSelect from "./tags-select";
import UserToken from "./user-token";
import { Input } from "./ui/input";
import { markdownToComment } from "@/helpers/clickup";

export default function IssueDetail() {
  const [task, setTask] = useAtom(taskAtom);
  const updateTask = useSetAtom(updateTaskAtom);

  const [isEditingName, setIsEditingName] = useState(false);
  const currentAssignees = useRef([]);
  const currentName = useRef("");
  const currentTags = useRef([]);

  if (!task)
    return (
      <li className="p-4 flex">
        <LoaderCircle className="animate-spin" />
      </li>
    );

  const reset = (attr, ref) =>
    setTask({
      ...task,
      [attr]: ref.current,
    });

  const resetAssignees = () => reset("assignees", currentAssignees);
  const resetName = () => reset("name", currentName);
  const resetTags = () => reset("tags", currentTags);

  const {
    assignees,
    comments,
    creator,
    dateCreated,
    markdownDescription,
    name,
    status,
    tags,
    url,
  } = task;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-2">
        <EditToggle
          display={() => (
            <h2 className="font-bold text-2xl/6 me-2 text-left">{name}</h2>
          )}
          edit={() => (
            <Input
              type="text"
              className="md:text-xl mb-2"
              value={name}
              onChange={(e) => setTask({ ...task, name: e.target.value })}
            />
          )}
          onCancel={() => {
            resetName();
            setIsEditingName(false);
          }}
          onEdit={() => {
            currentName.current = name;
            setIsEditingName(true);
          }}
          onSave={async () => {
            const res = await updateTask({ name });
            if (res.error) resetName();
            setIsEditingName(false);
          }}
        />

        {isEditingName ? null : <IssueCloseButton />}
      </div>
      <div className="flex">
        <StatusSelect status={status} />
        {url && (
          <a
            href={url}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            target="_blank"
            title="Open task in ClickUp"
          >
            <ExternalLink />
          </a>
        )}
      </div>
      <div className="mb-2">
        <EditToggle
          display={() =>
            tags.length > 0 ? (
              <div>
                {tags.map((tag) => (
                  <TagToken key={tag.name} {...tag} />
                ))}
              </div>
            ) : (
              <p className="italic me-2">No tags</p>
            )
          }
          edit={() => <TagsSelect />}
          onCancel={resetTags}
          onEdit={() => (currentTags.current = task.tags)}
          onSave={async () => {
            const res = await updateTask({
              tags: calculateDiff(currentTags.current, task.tags, "name"),
            });
            if (res.error) resetTags();
          }}
        />
      </div>
      <div className="mb-2">
        <EditToggle
          display={() =>
            assignees.length > 0 ? (
              <div>
                {assignees.map((assignee) => (
                  <UserToken key={assignee.email} user={assignee} />
                ))}
              </div>
            ) : (
              <p className="italic me-2">Assigned to nobody</p>
            )
          }
          edit={() => <TaskAssigneesSelect />}
          onCancel={resetAssignees}
          onEdit={() => (currentAssignees.current = task.assignees)}
          onSave={async () => {
            const res = await updateTask({
              assignees: calculateDiff(
                currentAssignees.current,
                task.assignees,
                "id",
              ),
            });
            if (res.error) resetAssignees();
          }}
        />
      </div>

      <Comment
        user={creator}
        date={dateCreated}
        action="opened"
        comment={markdownToComment(markdownDescription)}
      />
      {comments &&
        comments
          .toReversed()
          .map((comment) => <Comment key={comment.id} {...comment} />)}
      <CommentForm />
    </div>
  );
}
