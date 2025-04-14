import { usePortalState } from "@/helpers/state";
import { useSignal, useSignalEffect } from "@preact/signals-react";

import { LoaderCircle, X } from "lucide-react";
import Comment from "./comment";
import StatusToken from "./status-token";
import TagToken from "./tag-token";

export default function IssueDetail() {
  const { getTask, issue } = usePortalState();
  const task = useSignal(null);

  useSignalEffect(() => {
    (async () => {
      if (issue.value) task.value = await getTask(issue.value);
    })();
  });

  if (!task.value)
    return (
      <li className="p-4 flex">
        <LoaderCircle className="animate-spin" />
      </li>
    );

  const { creator, dateCreated, description, id, name, status, tags } =
    task.value;
  return (
    <div className="p-4">
      <div className="flex items-start">
        <h2 className="font-bold mb-2 text-2xl">{name}</h2>
        <button
          className="text-muted-foreground hover:text-foreground cursor-pointer ml-2 mb-2"
          onClick={() => (issue.value = null)}
        >
          <X />
        </button>
      </div>
      <StatusToken {...status} />
      <div className="mb-2">
        {tags.map((tag) => (
          <TagToken {...tag} />
        ))}
      </div>
      <Comment
        user={creator}
        date={dateCreated}
        action="opened"
        text={description}
      />
    </div>
  );
}
