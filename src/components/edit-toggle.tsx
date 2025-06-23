import { batch, useSignal } from "@preact/signals-react";

import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { Button } from "./ui/button";

export default function EditToggle({
  display,
  edit,
  isEditable = true,
  onCancel = () => {},
  onEdit = () => {},
  onSave = () => {},
}: {
  display: Function;
  edit: Function;
  isEditable: boolean;
  onCancel?: Function;
  onEdit?: Function;
  onSave?: Function;
}) {
  const isEditing = useSignal(false);
  const isProcessing = useSignal(false);

  const exit = (handler: Function) => {
    isProcessing.value = true;
    (async () => {
      await handler();
      batch(() => {
        isEditing.value = false;
        isProcessing.value = false;
      });
    })();
  };

  if (isProcessing.value) return <LoaderCircle className="animate-spin" />;
  if (!isEditable) return display();
  return isEditing.value ? (
    <div className="flex justify-between">
      {edit()}
      <div className="ms-2">
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => exit(onSave)}
            className="cursor-pointer"
            aria-label="Save"
            title="Save"
          >
            <Check />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => exit(onCancel)}
            className="cursor-pointer"
            aria-label="Cancel"
            title="Cancel"
          >
            <X />
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <button
      variant="ghost"
      onClick={() => {
        (async () => {
          await onEdit();
          isEditing.value = true;
        })();
      }}
      className="group/edit-button cursor-pointer flex items-center"
      aria-label="Edit"
      title="Edit"
    >
      {display()}
      <Pencil className="invisible group-hover/edit-button:visible" size={16} />
    </button>
  );
}
