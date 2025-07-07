import { linkPattern } from "./markdown";

export type CommentNode = {
  text: string;
  attributes?: { link?: string };
};

export const importTask = (task) => ({
  ...task,
  tags: task.tags.filter((tag) => !tag.name.startsWith("meta_type:")),
});

export const exportTask = (task) => {
  const result = { ...task };
  if ("markdown_description" in result) {
    result.markdown_content = result.markdown_description;
    delete result.markdown_description;
  }
  return result;
};

const commentPartToMarkdown = ({ attributes, text }: CommentNode) =>
  attributes?.link ? `[${text}](${attributes.link})` : text;

export const commentToMarkdown = (comment: CommentNode | CommentNode[]) =>
  Array.isArray(comment)
    ? comment.map(commentPartToMarkdown).join("")
    : commentPartToMarkdown(comment);

export const markdownToComment = (markdown: string): CommentNode[] => {
  const comment = [];
  let lastIndex = 0;
  let match;

  while ((match = linkPattern.exec(markdown)) !== null) {
    const [, linkText, url] = match;

    // Push the text before the link.
    if (match.index > lastIndex)
      comment.push({ text: markdown.slice(lastIndex, match.index) });

    // Push the link.
    comment.push({ text: linkText, attributes: { link: url } });
    lastIndex = linkPattern.lastIndex;
  }

  // Push any remaining text after the last link.
  if (lastIndex < markdown.length)
    comment.push({ text: markdown.slice(lastIndex) });

  return comment;
};
