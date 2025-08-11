import { useRef } from "react";
import { useSignalEffect } from "@preact/signals-react";
import { usePortalState } from "@/helpers/state";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import ColorChooserMenuItems from "@/components/color-chooser-menu-items";

export default function MapContextMenu({ children }) {
  const {
    contextMenu,
    mapCatalogQuery,
    rotateSelectedGeographies,
    selectedGeographies,
  } = usePortalState();
  const trigger = useRef(null);

  const feature = contextMenu.value?.feature;
  const selectionCount = selectedGeographies.value.length;

  useSignalEffect(() => {
    if (
      contextMenu.value &&
      contextMenu.value.type === "geography-select" &&
      trigger.current
    ) {
      const { x, y } = contextMenu.value;
      trigger.current.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          clientX: x,
          clientY: y,
        }),
      );
    }
  });

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) contextMenu.value = null;
      }}
    >
      <ContextMenuTrigger ref={trigger}>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {feature && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger inset>
                Select {mapCatalogQuery.value.dataset.grid.label.toLowerCase()}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuLabel>Choose outline color</ContextMenuLabel>
                <ColorChooserMenuItems feature={feature} />
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          disabled={!selectionCount}
          onSelect={() => (selectedGeographies.value = [])}
        >
          <X /> Clear selection
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!selectionCount}
          onSelect={() => rotateSelectedGeographies(-1)}
        >
          <ChevronLeft /> Previous selection
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!selectionCount}
          onSelect={() => rotateSelectedGeographies(1)}
        >
          <ChevronRight /> Next selection
        </ContextMenuItem>
        <ContextMenuItem
          disabled={selectionCount < 10}
          onSelect={() => rotateSelectedGeographies(-10)}
        >
          <ChevronsLeft /> Previous 10 selections
        </ContextMenuItem>
        <ContextMenuItem
          disabled={selectionCount < 10}
          onSelect={() => rotateSelectedGeographies(10)}
        >
          <ChevronsRight /> Next 10 selections
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
