import { cn } from "@/lib/utils";
import { toTitleCase } from "@/helpers/utils";

import { ChevronDown } from "lucide-react";
import StatusIcon from "./status-icon";

export default function StatusToken({
  caret = false,
  className = "",
  size = 20,
  status,
  type,
}: {
  caret: boolean;
  className: string;
  size: number;
  status: string;
  type: string;
}) {
  return (
    <span
      className={cn(
        `inline-block px-2 py-1 rounded-md min-w ${(type === "open" && "bg-green-700") || (type === "closed" && "bg-red-700") || "bg-gray-700"} ${className}`,
      )}
    >
      <span className="flex gap-2 items-center text-white">
        <StatusIcon color="white" size={size} type={type} />{" "}
        {toTitleCase(status)}
        {caret && (
          <ChevronDown
            size={size}
            className="box-content ml-2 pl-2 border-l-2"
          />
        )}
      </span>
    </span>
  );
}
