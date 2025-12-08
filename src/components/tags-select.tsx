import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";

// State atoms
const tagOptions = useAtomValue(atoms.tagOptionsAtom);
const task = useAtomValue(atoms.taskAtom);

import RSelect from "@/components/ui/rselect";

export default function TagsSelect() {
  

  const optionsMap = {};
  for (let option of tagOptions) optionsMap[option] = option;

  return (
    tagOptions?.length > 0 && (
      <RSelect
        inputId="tags"
        options={tagOptions}
        isMulti={true}
        isClearable={true}
        className="mb-4 w-full"
        placeholder="Tags..."
        value={task?.tags.map((tag) => optionsMap[tag.name])}
        onChange={(selected) =>
          (task = {
            ...task,
            tags: selected.map((option) => ({ name: option })),
          })
        }
      />
    )
  );
}
