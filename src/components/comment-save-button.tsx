import { MouseEventHandler } from "react";

import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoaderCircle, TriangleAlert } from "lucide-react";

export default function CommentSaveButton({
  buttonLabel = "Comment",
  disabled = false,
  onClick,
  processing = false,
  warning = "",
}: {
  buttonLabel?: string;
  disabled: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
  processing?: boolean;
  warning?: string;
}) {
  const showWarning = warning && !disabled;
  const button = (
    <Button
      className={`cursor-pointer bg-green-700 hover:bg-green-600 text-white font-bold ${showWarning && "bg-red-700 hover:bg-red-600"}`}
      onClick={onClick}
      disabled={disabled || processing}
    >
      {processing ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        <>
          {showWarning ? <TriangleAlert /> : null}
          {buttonLabel}
        </>
      )}
    </Button>
  );
  return showWarning ? (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        {warning}
      </TooltipContent>
    </Tooltip>
  ) : (
    button
  );
}
