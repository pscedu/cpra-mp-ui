import { ReactNode, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <>
      <Textarea
        id="comment"
        placeholder={placeholder}
        className="h-50 mb-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" className="cursor-pointer">
          <Link /> Insert map/chart link
        </Button>
        {children}
      </div>
    </>
  );
}
