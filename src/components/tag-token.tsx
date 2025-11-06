import DimensionIcon from "./dimension-icon";
import { useAtomValue } from "jotai";
import { structureAtom } from "@/helpers/state";
import { toTitleCase } from "@/helpers/utils";

const categoryColor = {
  variable: "bg-purple-400",
  model_group_id: "bg-blue-400",
  scenario_id: "bg-green-400",
  default: "bg-stone-400",
};

export default function TagToken({
  name,
  onClick,
}: {
  name: string;
  onClick?: Function;
}) {
  const structure = useAtomValue(structureAtom);

  const [category, value] = name.split(":");
  const valueLabel = structure?.dimensionsMap[category]?.values?.find(
    (dv) => dv.value.toString() === value,
  )?.label;

  const Tag = onClick ? "button" : "span";

  return (
    <Tag
      className={`inline-block px-2 py-0.75 rounded-md min-w mr-2 mb-2 text-xs font-bold text-black ${categoryColor[category] || categoryColor.default} ${onClick ? "cursor-pointer" : ""}`}
      title={name}
      onClick={onClick}
    >
      <span className="flex gap-2 items-center whitespace-nowrap overflow-hidden flex-nowrap">
        <DimensionIcon name={category} size={16} />
        {valueLabel || toTitleCase(value || category)}
      </span>
    </Tag>
  );
}
