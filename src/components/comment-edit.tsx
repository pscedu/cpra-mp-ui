import { ReactNode, useEffect, useRef } from "react";
import { usePortalState } from "@/helpers/state";

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
  const { permalinkBaseUrl } = usePortalState();
  const textarea = useRef(null);

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

  const insertLink = () => {
    const ta = textarea.current;
    if (ta) {
      const before = value.slice(0, ta.selectionStart);
      const selection = value.slice(ta.selectionStart, ta.selectionEnd);
      const after = value.slice(ta.selectionEnd, value.length);
      setValue(
        `${before}[${selection || "map and chart"}](${permalinkBaseUrl.value})${after}`,
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
          onClick={insertLink}
        >
          <Link /> Insert map/chart link
        </Button>
        {children}
      </div>
    </>
  );
}
