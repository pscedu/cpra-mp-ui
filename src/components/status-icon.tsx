import { CircleDot, CircleCheck, CircleHelp } from "lucide-react";

export default function StatusIcon({
  color,
  size = 20,
  type,
}: {
  color: string;
  size: number;
  type: string;
}) {
  const Icon =
    type === "open" ? CircleDot : type === "closed" ? CircleCheck : CircleHelp;
  return <Icon size={size} style={{ color }} />;
}
