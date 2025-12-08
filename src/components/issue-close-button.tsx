import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";

// State atoms
const issue = useAtomValue(atoms.issueAtom);
const task = useAtomValue(atoms.taskAtom);

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
  
  return (
    <Button
      className="cursor-pointer"
      variant={variant}
      onClick={() =>
        batch(() => {
          issue = null;
          task = null;
        })
      }
    >
      {children ? children : <X />}
    </Button>
  );
}
