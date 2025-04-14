import DimensionIcon from "./dimension-icon";
import { usePortalState } from "@/helpers/state";

export default function TagToken({ name, tag_bg }) {
  const { structure } = usePortalState();

  const [category, value] = name.split(":");
  const valueLabel = structure.value?.dimensionsMap[category]?.values?.find(
    (dv) => dv.value.toString() === value,
  )?.label;

  return (
    <button
      className="inline-block px-2 py-0.75 rounded-md min-w mr-2 mb-2 text-sm font-bold text-black"
      title={name}
      style={{ backgroundColor: tag_bg }}
    >
      <span className="flex gap-2 items-center">
        <DimensionIcon name={category} size={16} />
        {valueLabel || value || category}
      </span>
    </button>
  );
}
