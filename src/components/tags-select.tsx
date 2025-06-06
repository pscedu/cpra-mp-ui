import { usePortalState } from "@/helpers/state";

import RSelect from "@/components/ui/rselect";

export default function TagsSelect() {
  const { tagOptions, task } = usePortalState();

  const optionsMap = {};
  for (let option of tagOptions.value) optionsMap[option.value] = option;

  return (
    tagOptions.value.length > 0 && (
      <RSelect
        inputId="tags"
        options={tagOptions.value}
        isMulti={true}
        isClearable={true}
        className="mb-4 w-full"
        placeholder="Tags..."
        value={task.value.tags.map((tag) => optionsMap[tag.name])}
        onChange={(selected) =>
          (task.value = {
            ...task.value,
            tags: selected.map((option) => ({ name: option.value })),
          })
        }
      />
    )
  );
}
