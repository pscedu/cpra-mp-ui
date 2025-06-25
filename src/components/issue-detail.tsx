import { calculateDiff } from "@/helpers/management";
import { usePortalState } from "@/helpers/state";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { buttonVariants } from "./ui/button";

import { ExternalLink, LoaderCircle } from "lucide-react";
import AssigneesSelect from "./assignees-select";
import Comment from "./comment";
import CommentForm from "./comment-form";
import EditToggle from "./edit-toggle";
import IssueCloseButton from "./issue-close-button";
import StatusSelect from "./status-select";
import TagToken from "./tag-token";
import TagsSelect from "./tags-select";
import UserToken from "./user-token";
import { Input } from "./ui/input";
import { useSignal } from "@preact/signals-react";

export default function IssueDetail() {
  const { task, updateTask } = usePortalState();
  const isEditingName = useSignal(false);
  const currentAssignees = useRef([]);
  const currentName = useRef("");
  const currentTags = useRef([]);

  if (!task.value)
    return (
      <li className="p-4 flex">
        <LoaderCircle className="animate-spin" />
      </li>
    );

  const reset = (attr, ref) =>
    (task.value = {
      ...task.value,
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
  } = task.value;

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
              onChange={(e) =>
                (task.value = { ...task.value, name: e.target.value })
              }
            />
          )}
          onCancel={() => {
            resetName();
            isEditingName.value = false;
          }}
          onEdit={() => {
            currentName.current = name;
            isEditingName.value = true;
          }}
          onSave={async () => {
            const res = await updateTask({ name });
            if (res.error) resetName();
            isEditingName.value = false;
          }}
        />

        {isEditingName.value ? null : <IssueCloseButton />}
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
              <p className="italic">No tags</p>
            )
          }
          edit={() => <TagsSelect />}
          onCancel={resetTags}
          onEdit={() => (currentTags.current = task.value.tags)}
          onSave={async () => {
            const res = await updateTask({
              tags: calculateDiff(currentTags.current, task.value.tags, "name"),
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
              <p className="italic">Assigned to nobody</p>
            )
          }
          edit={() => <AssigneesSelect />}
          onCancel={resetAssignees}
          onEdit={() => (currentAssignees.current = task.value.assignees)}
          onSave={async () => {
            const res = await updateTask({
              assignees: calculateDiff(
                currentAssignees.current,
                task.value.assignees,
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
        commentText={markdownDescription}
      />
      {comments &&
        comments
          .toReversed()
          .map((comment) => <Comment key={comment.id} {...comment} />)}
      <CommentForm />
    </div>
  );
}
