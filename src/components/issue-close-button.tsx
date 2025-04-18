import { usePortalState } from "@/helpers/state";
import { X } from "lucide-react";

export default function IssueCloseButton() {
  const { issue } = usePortalState();
  return (
    <button
      className="text-muted-foreground hover:text-foreground cursor-pointer ml-2 mb-2"
      onClick={() => (issue.value = null)}
    >
      <X />
    </button>
  );
}
