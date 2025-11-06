import { useState } from "react";

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
  isEditable?: boolean;
  onCancel?: Function;
  onEdit?: Function;
  onSave?: Function;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const exit = (handler: Function) => {
    setIsProcessing(true);
    (async () => {
      await handler();
      setIsEditing(false);
      setIsProcessing(false);
    })();
  };

  if (isProcessing) return <LoaderCircle className="animate-spin" />;
  if (!isEditable) return display();
  return isEditing ? (
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
          setIsEditing(true);
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
