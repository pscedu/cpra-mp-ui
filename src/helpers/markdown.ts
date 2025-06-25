export const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

export const hasLink = (text: string) => text.match(linkPattern) !== null;
