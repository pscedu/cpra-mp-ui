import { ReactNode, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import {
  catalogQueriesAtom,
  dataPermalinkAtom,
  selectedGeographiesAtom,
  store,
  structureAtom,
} from "@/helpers/state";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "lucide-react";

export default function CommentEdit({
  cacheKey = null,
  children,
  defaultValue = "",
  placeholder = "Add your comment...",
  setValue,
  value,
}: {
  cacheKey: string | null;
  children?: ReactNode;
  defaultValue?: string;
  placeholder?: string;
  setValue: (text: string) => void;
  value: string;
}) {
  const selectedGeographies = useAtomValue(selectedGeographiesAtom);
  const structure = useAtomValue(structureAtom);
  const mapCatalogQuery = useAtomValue(catalogQueriesAtom).getMapCatalogQuery();

  const textarea = useRef<HTMLTextAreaElement>(null);
  const label = selectedGeographies?.length ? "map and chart" : "map";

  useEffect(() => {
    if (!cacheKey) return;
    const initial = localStorage.getItem(cacheKey);
    if (initial) setValue(initial);
  }, []);

  useEffect(() => {
    if (!cacheKey) return;
    if (value != defaultValue) localStorage.setItem(cacheKey, value);
    else localStorage.removeItem(cacheKey);
  }, [cacheKey, defaultValue, value]);

  const insertLink = async () => {
    const icons = ["🌎️"];
    if (selectedGeographies?.length > 0) icons.push("📈");
    const resolvedStructure = await structure;
    const label = resolvedStructure?.getDataLabel(
      mapCatalogQuery,
      selectedGeographies,
    );
    const ta = textarea.current;
    if (ta) {
      const before = value.slice(0, ta.selectionStart);
      const selection = value.slice(ta.selectionStart, ta.selectionEnd);
      const after = value.slice(ta.selectionEnd, value.length);
      const permalink = store.get(dataPermalinkAtom);
      setValue(
        `${before}[${selection || `${icons.join("")} ${label}`}](${permalink})${after}`,
      );
    }
  };

  return (
    <>
      <Textarea
        id="comment"
        placeholder={placeholder}
        className="h-50 mb-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        ref={textarea}
      />
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          className="cursor-pointer"
          disabled={!structure}
          onClick={insertLink}
        >
          <Link /> Insert current {label} link
        </Button>
        {children}
      </div>
    </>
  );
}
