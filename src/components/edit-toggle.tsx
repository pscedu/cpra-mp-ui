import { batch, useSignal } from "@preact/signals-react";

import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { Button } from "./ui/button";

export default function EditToggle({
  display,
  edit,
  onCancel = () => {},
  onEdit = () => {},
  onSave = () => {},
}: {
  display: Function;
  edit: Function;
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
  return (
    <div className="flex justify-between">
      {isEditing.value ? edit() : display()}
      <div className="ms-2">
        {isEditing.value ? (
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
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              (async () => {
                await onEdit();
                isEditing.value = true;
              })();
            }}
            className="cursor-pointer"
            aria-label="Edit"
            title="Edit"
          >
            <Pencil />
          </Button>
        )}
      </div>
    </div>
  );
}
