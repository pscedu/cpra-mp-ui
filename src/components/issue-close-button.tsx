import { useSetAtom } from "jotai";
import { issueAtom } from "@/helpers/state";

import { Button } from "./ui/button";
import { ReactNode } from "react";
import { X } from "lucide-react";

export default function IssueCloseButton({
  children,
  variant = "ghost",
}: {
  children?: ReactNode;
  variant?: "ghost" | "outline";
}) {
  const setIssue = useSetAtom(issueAtom);

  return (
    <Button
      className="cursor-pointer"
      variant={variant}
      onClick={() => setIssue(null)}
    >
      {children ? children : <X />}
    </Button>
  );
}
