import { usePortalState } from "@/helpers/state";

import RSelect from "@/components/ui/rselect";

export default function TagsSelect() {
  const { tagOptions, task } = usePortalState();

  return (
    tagOptions.value.length > 0 && (
      <RSelect
        inputId="tags"
        options={tagOptions.value}
        isMulti={true}
        isClearable={true}
        className="mb-4"
        placeholder="Tags..."
        value={task.value.tags}
        onChange={(selected) =>
          (task.value = { ...task.value, tags: selected })
        }
      />
    )
  );
}
