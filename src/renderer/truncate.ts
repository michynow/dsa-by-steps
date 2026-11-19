const CHARACTER_WIDTH = 8;

export function truncateToWidth(text: string, width: number): string {
  const limit = Math.floor(width / CHARACTER_WIDTH);
  const characters = Array.from(text);
  return characters.length <= limit ? text : `${characters.slice(0, limit - 1).join('')}…`;
}
