import { Calendar, Cog, Grid3x3, Leaf, Ruler, Tag } from "lucide-react";

const dimensionIcons = {
  variable: Ruler,
  grid: Grid3x3,
  time_unit: Calendar,
  model_group_id: Cog,
  scenario_id: Leaf,
  default: Tag,
};

export default function DimensionIcon({ name, ...props }: { name: string }) {
  const Icon = dimensionIcons[name] || dimensionIcons.default;
  return <Icon {...props} />;
}
