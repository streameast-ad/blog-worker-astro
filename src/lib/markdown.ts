import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true
});

/**
 * Parses markdown to HTML string
 */
export async function renderMarkdown(content: string): Promise<string> {
  if (!content) return '';
  return await marked.parse(content);
}

/**
 * Calculates estimated reading time in minutes
 */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime > 0 ? readingTime : 1;
}
