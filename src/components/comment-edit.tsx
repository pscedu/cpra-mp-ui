import { ReactNode, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function CommentEdit({
  cacheKey,
  children,
  setValue,
  value,
}: {
  cacheKey: string;
  children?: ReactNode;
  setValue: (text: string) => void;
  value: string;
}) {
  useEffect(() => {
    const initial = localStorage.getItem(cacheKey);
    if (initial) setValue(initial);
  }, []);

  useEffect(() => {
    if (value.length) localStorage.setItem(cacheKey, value);
    else localStorage.removeItem(cacheKey);
  }, [cacheKey, value]);

  return (
    <>
      <Textarea
        id="comment"
        placeholder="Add your comment..."
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
