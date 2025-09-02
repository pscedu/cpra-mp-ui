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
  ContextMenuShortcut,
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
    visualization,
  } = usePortalState();
  const trigger = useRef(null);

  const geography = contextMenu.value?.geography;
  const selectionCount = selectedGeographies.value.length;
  const maxGeographies = visualization?.value?.max_geographies || 10;

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
        {geography && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger inset>
                Select {mapCatalogQuery.value.dataset.grid.label.toLowerCase()}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuLabel>Choose outline color</ContextMenuLabel>
                <ColorChooserMenuItems geography={geography} />
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
          <ContextMenuShortcut>Esc</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!selectionCount}
          onSelect={() => rotateSelectedGeographies(-1)}
        >
          <ChevronLeft /> Previous selection
          <ContextMenuShortcut>Ctrl &larr;</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!selectionCount}
          onSelect={() => rotateSelectedGeographies(1)}
        >
          <ChevronRight /> Next selection
          <ContextMenuShortcut>Ctrl &rarr;</ContextMenuShortcut>
        </ContextMenuItem>
        {maxGeographies > 1 && (
          <>
            <ContextMenuItem
              disabled={selectionCount <= maxGeographies}
              onSelect={() => rotateSelectedGeographies(-1 * maxGeographies)}
            >
              <ChevronsLeft /> Previous {maxGeographies} selections
              <ContextMenuShortcut>Ctrl &uarr;</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem
              disabled={selectionCount <= maxGeographies}
              onSelect={() => rotateSelectedGeographies(maxGeographies)}
            >
              <ChevronsRight /> Next {maxGeographies} selections
              <ContextMenuShortcut>Ctrl &darr;</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
