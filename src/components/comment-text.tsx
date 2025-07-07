import { CommentNode } from "@/helpers/clickup";

import CommentLink from "@/components/comment-link";

export default function CommentText({
  comment,
}: {
  comment: CommentNode | CommentNode[];
}) {
  // Consolidate non-link nodes.
  const nodes = [];
  for (const [i, node] of (Array.isArray(comment)
    ? comment
    : [comment]
  ).entries()) {
    if (
      i === 0 ||
      node.attributes?.link !== nodes[nodes.length - 1].attributes?.link
    )
      nodes.push({ ...node });
    else nodes[nodes.length - 1].text += node.text;
  }

  const paragraphs: CommentNode[][] = [[]];
  for (const node of nodes) {
    if (node.attributes?.link) paragraphs[paragraphs.length - 1].push(node);
    else {
      for (const text of node.text.split(/\s*\n\s*\n\s*/g)) {
        paragraphs[paragraphs.length - 1].push({ text });
        paragraphs.push([]);
      }
      paragraphs.pop();
    }
  }

  return paragraphs.map((p, i) =>
    p.length ? (
      <p key={i} className="mb-2 last:mb-0">
        {p.map((node, i) =>
          node.attributes?.link ? (
            <CommentLink key={i} href={node.attributes.link}>
              {node.text}
            </CommentLink>
          ) : (
            <span key={i}>{node.text}</span>
          ),
        )}
      </p>
    ) : null,
  );
}
