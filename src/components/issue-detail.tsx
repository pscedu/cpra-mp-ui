import { calculateDiff } from "@/helpers/management";
import { usePortalState } from "@/helpers/state";
import { useRef } from "react";

import { LoaderCircle } from "lucide-react";
import AssigneesSelect from "./assignees-select";
import Comment from "./comment";
import CommentForm from "./comment-form";
import EditToggle from "./edit-toggle";
import IssueCloseButton from "./issue-close-button";
import StatusSelect from "./status-select";
import TagToken from "./tag-token";
import TagsSelect from "./tags-select";
import UserToken from "./user-token";

export default function IssueDetail() {
  const { task, updateTask } = usePortalState();
  const currentAssignees = useRef([]);
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
  const resetTags = () => reset("tags", currentTags);

  const {
    assignees,
    comments,
    creator,
    dateCreated,
    description,
    id,
    name,
    status,
    tags,
  } = task.value;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <h2 className="font-bold mb-2 text-2xl">{name}</h2>
        <IssueCloseButton />
      </div>
      <StatusSelect status={status} />
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
              tags: calculateDiff(currentTags.current, task.value.tags, "id"),
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
        commentText={description}
      />
      {comments &&
        comments
          .toReversed()
          .map((comment) => <Comment key={comment.id} {...comment} />)}
      <CommentForm />
    </div>
  );
}
