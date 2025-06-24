const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;

export const hasLink = (text: string) => text.match(linkPattern) !== null;
