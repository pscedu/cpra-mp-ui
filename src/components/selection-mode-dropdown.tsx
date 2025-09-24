import { batch } from "@preact/signals-react";
import { usePortalState } from "@/helpers/state";

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
  const { analysisType } = usePortalState();
  const [analysisOperation, analysisDimension] = analysisType.value.split(":");

  const options = [
    {
      value: "single",
      label: "View Single",
      icon: Square,
      maxLength: 1,
    },
    // {
    //   value: "compare",
    //   label: "Compare Multiple",
    //   icon: SquareStack,
    //   maxLength: Infinity,
    // },
  ];

  if (supportsSubtract)
    options.push(
      {
        value: "subtract-asc",
        label: "Subtract: A - B",
        icon: SquaresSubtract,
        maxLength: 2,
      },
      {
        value: "subtract-desc",
        label: "Subtract: B - A",
        icon: SquaresSubtract,
        className: "rotate-180",
        maxLength: 2,
      },
    );

  // if (supportsConcatenate)
  //   options.push({
  //     value: "concatenate",
  //     label: "Concatenate",
  //     icon: Ampersand,
  //     maxLength: 2,
  //   });

  const selectedOption = options.find(
    (option) =>
      option.value ===
      (analysisDimension === dimensionName
        ? analysisOperation
        : maxLength > 1
          ? "compare"
          : "single"),
  );

  // Set the initial max length in the parent component.
  useEffect(() => {
    setMaxLength(selectedOption?.maxLength || 1);
  }, []);

  const setSelectedOption = (value) => {
    const newSelectedOption = options.find((option) => option.value === value);
    batch(() => {
      setMaxLength(newSelectedOption?.maxLength || 1);
      analysisType.value = ["single", "compare"].includes(value)
        ? "single"
        : `${value}:${dimensionName}`;
    });
  };

  const SelectedIcon = selectedOption?.icon || CircleQuestionMark;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={className}
          disabled={optionsLength === 1}
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
