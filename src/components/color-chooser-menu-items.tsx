import { selectionColors, selectionColorLabels } from "@/helpers/config";
import { usePortalState } from "@/helpers/state";

import { ContextMenuItem } from "@/components/ui/context-menu";
import { Circle, CircleCheckBig } from "lucide-react";

// Color chooser that allows users to select what color a selected geography will
// be assigned.
export default function ColorChooserMenuItems({ feature }) {
  const { selectedGeographies } = usePortalState();

  const isSelected = selectedGeographies.value.includes(feature.id);

  return selectionColors
    .slice(0, selectedGeographies.value.length + (isSelected ? 0 : 1))
    .map((color, colorIdx) => {
      const selected = selectedGeographies.value[colorIdx] == feature.id;
      const Icon = selected ? CircleCheckBig : Circle;

      return (
        <ContextMenuItem
          disabled={selected}
          onSelect={() => {
            if (!isSelected) selectedGeographies.value.push(feature.id);
            const currentIdx = selectedGeographies.value.indexOf(feature.id);
            const currentId = selectedGeographies.value[colorIdx];
            selectedGeographies.value = selectedGeographies.value.map(
              (id: string, i: number) =>
                i == colorIdx ? feature.id : i == currentIdx ? currentId : id,
            );
          }}
        >
          <Icon style={{ color: `#${color}` }} />{" "}
          {selectionColorLabels[colorIdx]}
        </ContextMenuItem>
      );
    });
}
