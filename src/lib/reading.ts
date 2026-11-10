// Reading time is computed from the text itself: words divided by 200 words per minute, rounded up, at least one minute.
export const WORDS_PER_MINUTE = 200;

export function stripMarkdown(src: string): string {
  return src
    .replace(/^---[\s\S]*?---\s*/, '') // front matter
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links keep their text
    .replace(/[#>*_`|~-]/g, ' ');
}

export function wordCount(text: string): number {
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) ?? []).length;
}

export function readingMinutes(text: string): number {
  return Math.max(1, Math.ceil(wordCount(stripMarkdown(text)) / WORDS_PER_MINUTE));
}
