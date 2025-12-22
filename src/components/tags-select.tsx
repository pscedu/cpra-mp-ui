import { useAtomValue, useAtom } from "jotai";
import { tagOptionsAtom, taskAtom } from "@/helpers/state";

import RSelect from "@/components/ui/rselect";

export default function TagsSelect() {
  const tagOptions = useAtomValue(tagOptionsAtom);
  const [task, setTask] = useAtom(taskAtom);

  const optionsMap: Record<string, string> = {};
  for (let option of tagOptions || []) optionsMap[option.value] = option;

  return (
    tagOptions?.length > 0 && (
      <RSelect
        inputId="tags"
        options={tagOptions}
        isMulti={true}
        isClearable={true}
        className="mb-4 w-full"
        placeholder="Tags..."
        value={task?.tags.map((tag: any) => optionsMap[tag.name])}
        onChange={(selected: any) =>
          setTask({
            ...task,
            tags: selected.map((option: string) => ({ name: option.value })),
          })
        }
      />
    )
  );
}
