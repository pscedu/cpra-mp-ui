import { useRef } from "react";
import { usePortalState } from "@/helpers/state";

import { LoaderCircle } from "lucide-react";
import Comment from "./comment";
import StatusSelect from "./status-select";
import TagToken from "./tag-token";
import IssueCloseButton from "./issue-close-button";
import UserToken from "./user-token";
import CommentForm from "./comment-form";
import EditToggle from "./edit-toggle";
import AssigneesSelect from "./assignees-select";
import { calculateDiff } from "@/helpers/management";

export default function IssueDetail() {
  const { task, updateTask } = usePortalState();
  const currentAssignees = useRef([]);

  if (!task.value)
    return (
      <li className="p-4 flex">
        <LoaderCircle className="animate-spin" />
      </li>
    );

  const resetAssignees = () =>
    (task.value = {
      ...task.value,
      assignees: currentAssignees.current,
    });

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
        {tags.map((tag) => (
          <TagToken key={tag.name} {...tag} />
        ))}
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
