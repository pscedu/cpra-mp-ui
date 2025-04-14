import StatusIcon from "./status-icon";

export default function StatusToken({
  color,
  size = 20,
  status,
  type,
}: {
  color: string;
  size: number;
  status: string;
  type: string;
}) {
  return (
    <span
      className="inline-block px-2 py-1 rounded-md min-w mr-2 mb-4"
      style={{ backgroundColor: color }}
    >
      <span className="flex gap-2 items-center text-white">
        <StatusIcon color="white" size={size} type={type} /> {status}
      </span>
    </span>
  );
}
