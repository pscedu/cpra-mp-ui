import { ReactNode } from "react";
import { portalBaseUrl } from "@/helpers/config";
import { openPortalLink } from "@/helpers/hash";

export default function CommentLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      className="font-bold hover:underline"
      href={href}
      onClick={(e) => {
        if (href.startsWith(portalBaseUrl)) {
          e.preventDefault();
          openPortalLink(href);
        }
      }}
    >
      {children}
    </a>
  );
}
