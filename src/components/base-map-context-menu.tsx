import { Ref } from "react";
import { Coordinate } from "@/helpers/types";
import { GeographySelection } from "@/helpers/selection";

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
import BaseMapColorChooserMenuItems from "@/components/base-map-color-chooser-menu-items";

// The geography the context menu was opened on, and its position in the
// selection, or -1 when it is not selected yet.
export type ContextMenuTarget = {
  coordinate: Coordinate;
  index: number;
};

export default function BaseMapContextMenu({
  children,
  className = "",
  gridLabel,
  maxSelectedGeographies,
  selection,
  setSelection,
  setTarget,
  target,
  triggerRef,
}: {
  children: React.ReactNode;
  className?: string;
  gridLabel: string;
  maxSelectedGeographies: number;
  selection: GeographySelection;
  setSelection: (selection: GeographySelection) => void;
  setTarget: (target: ContextMenuTarget | null) => void;
  target: ContextMenuTarget | null;
  triggerRef: Ref<HTMLDivElement>;
}) {
  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) setTarget(null);
      }}
    >
      <ContextMenuTrigger ref={triggerRef} asChild>
        <div className={className}>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {target && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger inset>
                Select {gridLabel}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuLabel>Choose outline color</ContextMenuLabel>
                <BaseMapColorChooserMenuItems
                  selection={selection}
                  setSelection={setSelection}
                  target={target}
                />
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          disabled={!selection.length}
          onSelect={() => setSelection(new GeographySelection())}
        >
          <X /> Clear selection
          <ContextMenuShortcut>Esc</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!selection.length}
          onSelect={() => setSelection(selection.rotate(-1))}
        >
          <ChevronLeft /> Previous selection
          <ContextMenuShortcut>Ctrl &larr;</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!selection.length}
          onSelect={() => setSelection(selection.rotate(1))}
        >
          <ChevronRight /> Next selection
          <ContextMenuShortcut>Ctrl &rarr;</ContextMenuShortcut>
        </ContextMenuItem>
        {maxSelectedGeographies > 1 && (
          <>
            <ContextMenuItem
              disabled={selection.length <= maxSelectedGeographies}
              onSelect={() =>
                setSelection(selection.rotate(-1 * maxSelectedGeographies))
              }
            >
              <ChevronsLeft /> Previous {maxSelectedGeographies} selections
              <ContextMenuShortcut>Ctrl &uarr;</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem
              disabled={selection.length <= maxSelectedGeographies}
              onSelect={() =>
                setSelection(selection.rotate(maxSelectedGeographies))
              }
            >
              <ChevronsRight /> Next {maxSelectedGeographies} selections
              <ContextMenuShortcut>Ctrl &darr;</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
