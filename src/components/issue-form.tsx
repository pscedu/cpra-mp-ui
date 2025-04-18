import { useMemo } from "react";
import { usePortalState } from "@/helpers/state";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import RSelect from "@/components/ui/rselect";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import IssueCloseButton from "./issue-close-button";

export default function IssueForm() {
  const { users, structure } = usePortalState();

  const tagOptions = useMemo(() => {
    const options = [];
    if (structure.value) {
      for (let dimension of structure.value.dimensions) {
        if (dimension.values) {
          options.push(
            ...dimension.values.map((dv) => ({
              value: `${dimension.name}:${dv.value}`,
              label: `${dimension.label}: ${dv.label || dv.value}`,
            })),
          );
        }
      }
    }
    return options;
  }, [structure.value]);
  return (
    <div className="mx-4">
      <div className="flex items-start justify-between">
        <h2 className="font-bold mb-2 text-2xl">New Issue</h2>
        <IssueCloseButton />
      </div>
      <Input type="text" id="title" placeholder="Title" className="mb-4" />
      <Textarea
        id="description"
        placeholder="Description"
        className="h-50 mb-4"
      />
      <RSelect
        inputId="assignedTo"
        options={users.value.map((user) => ({
          value: user,
          label: user.fullName,
        }))}
        isClearable={true}
        className="mb-4"
        placeholder="Assigned to..."
      />
      {structure.value && (
        <RSelect
          inputId="tags"
          options={tagOptions}
          isMulti={true}
          isClearable={true}
          className="mb-4"
          placeholder="Tags..."
        />
      )}
      <div className="items-top flex space-x-2">
        <Checkbox id="saveUrl" />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="saveUrl"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Save map and chart with issue
          </label>
        </div>
      </div>
    </div>
  );
}
