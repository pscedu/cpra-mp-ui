import { useAtom, useAtomValue } from "jotai";
import { analysisAtom, structureAtom } from "@/helpers/state";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Ampersand,
  CircleQuestionMark,
  Square,
  SquareStack,
  SquaresSubtract,
} from "lucide-react";
import { useEffect } from "react";

type SelectionOption = {
  value: string;
  label: string;
  icon: typeof Square;
  maxLength: number;
  className?: string;
  // Only set for options backed by a registered analysis (i.e. not
  // "single"/"compare").
  analysisName?: string;
  order?: "asc" | "desc" | null;
};

export function SelectionModeDropdown({
  className,
  dimensionLabel,
  dimensionName,
  maxLength,
  optionsLength,
  setMaxLength,
  supportsSubtract,
  supportsConcatenate,
}) {
  const [analysis, setAnalysis] = useAtom(analysisAtom);
  const structure = useAtomValue(structureAtom);
  const { operation, dimension, order } = analysis;

  const options: SelectionOption[] = [
    {
      value: "single",
      label: "View Single",
      icon: Square,
      maxLength: 1,
    },
    {
      value: "compare",
      label: "Compare Multiple",
      icon: SquareStack,
      maxLength: Infinity,
    },
  ];

  // "difference" and "concatenate" are registered analyses (`/v1/analyses.json`);
  // if the API's catalog doesn't have one, don't offer it. "single" and
  // "compare" above are pure client-side view state and are never looked up
  // there.
  const difference = structure?.analysesMap["difference"];
  if (supportsSubtract && difference)
    options.push(
      {
        value: "difference-asc",
        label: `${difference.label}: A - B`,
        icon: SquaresSubtract,
        maxLength: 2,
        analysisName: difference.name,
        order: "asc",
      },
      {
        value: "difference-desc",
        label: `${difference.label}: B - A`,
        icon: SquaresSubtract,
        className: "rotate-180",
        maxLength: 2,
        analysisName: difference.name,
        order: "desc",
      },
    );

  const concatenate = structure?.analysesMap["concatenate"];
  if (supportsConcatenate && concatenate)
    options.push({
      value: "concatenate",
      label: concatenate.label,
      icon: Ampersand,
      maxLength: 2,
      analysisName: concatenate.name,
      order: null,
    });

  const selectedValue =
    dimension === dimensionName
      ? order
        ? `${operation}-${order}`
        : operation
      : maxLength > 1
        ? "compare"
        : "single";
  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );

  // Set the initial max length in the parent component.
  useEffect(() => {
    setMaxLength(selectedOption?.maxLength || 1);
  }, []);

  const setSelectedOption = (value: string) => {
    const newSelectedOption = options.find((option) => option.value === value);
    setMaxLength(newSelectedOption?.maxLength || 1);
    if (["single", "compare"].includes(value)) {
      if (analysis?.dimension === dimensionName)
        setAnalysis({ operation: "single", dimension: "" });
    } else if (newSelectedOption?.analysisName) {
      setAnalysis({
        operation: newSelectedOption.analysisName,
        dimension: dimensionName,
        order: newSelectedOption.order,
      });
    }
  };

  const SelectedIcon = selectedOption?.icon || CircleQuestionMark;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={className}
          disabled={optionsLength === 1 || options.length === 1}
        >
          <SelectedIcon className={selectedOption?.className} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-55" align="start">
        <DropdownMenuLabel>{dimensionLabel} Selection Mode</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={selectedOption?.value}
          onValueChange={setSelectedOption}
        >
          {options.map((option) => {
            const OptionIcon = option?.icon || CircleQuestionMark;
            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <div className="flex justify-between w-full">
                  {option.label} <OptionIcon className={option.className} />
                </div>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
