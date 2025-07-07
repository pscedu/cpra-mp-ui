import { linkPattern } from "@/helpers/markdown";
import { portalBaseUrl } from "@/helpers/config";
import { mergeHash } from "@/helpers/hash";

export default function Markdown({ text }: { text: string }) {
  return text.split(/\s*\n\s*\n\s*/g).map((markdownText, i) => {
    const nodes = [];
    let lastIndex = 0;
    let match;

    while ((match = linkPattern.exec(markdownText)) !== null) {
      const [, linkText, url] = match;

      // Push the text before the link.
      if (match.index > lastIndex)
        nodes.push(markdownText.slice(lastIndex, match.index));

      // Push the link.
      nodes.push(
        <a
          href={url}
          key={match.index}
          className="font-bold hover:underline"
          onClick={(e) => {
            if (url.startsWith(portalBaseUrl)) {
              e.preventDefault();
              mergeHash(url);
            }
          }}
        >
          {linkText}
        </a>,
      );

      lastIndex = linkPattern.lastIndex;
    }

    // Push any remaining text after the last link.
    if (lastIndex < markdownText.length)
      nodes.push(markdownText.slice(lastIndex));

    return (
      <p key={i} className="mb-2 last:mb-0">
        {nodes}
      </p>
    );
  });
}
