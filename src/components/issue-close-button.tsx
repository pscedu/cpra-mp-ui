import { batch } from "@preact/signals-react";
import { usePortalState } from "@/helpers/state";

import { Button } from "./ui/button";
import { ReactNode } from "react";
import { X } from "lucide-react";

export default function IssueCloseButton({
  children,
  variant = "ghost",
}: {
  children: ReactNode;
  variant: "ghost" | "outline";
}) {
  const { issue, task } = usePortalState();
  return (
    <Button
      className="cursor-pointer"
      variant={variant}
      onClick={() =>
        batch(() => {
          issue.value = null;
          task.value = null;
        })
      }
    >
      {children ? children : <X />}
    </Button>
  );
}
