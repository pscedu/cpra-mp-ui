import { MouseEventHandler } from "react";
import { hasLink } from "@/helpers/markdown";

import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoaderCircle, TriangleAlert } from "lucide-react";

export default function CommentSaveButton({
  buttonLabel = "Comment",
  fieldLabel = "comment",
  onClick,
  processing = false,
  text = "",
}: {
  buttonLabel?: string;
  fieldLabel?: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  processing?: boolean;
  text?: string;
}) {
  const disabled = text.length == 0;
  const warning =
    disabled || hasLink(text)
      ? null
      : `Your ${fieldLabel} does not contain a link.`;
  const button = (
    <Button
      className={`cursor-pointer bg-green-700 hover:bg-green-600 text-white font-bold ${warning && "bg-red-700 hover:bg-red-600"}`}
      onClick={onClick}
      disabled={disabled || processing}
    >
      {processing ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        <>
          {warning ? <TriangleAlert /> : null}
          {buttonLabel}
        </>
      )}
    </Button>
  );
  return warning ? (
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
