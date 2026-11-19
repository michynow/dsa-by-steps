const ownsEveryKey =
  'input, textarea, select, [contenteditable], [role="radiogroup"], [role="radio"], [role="textbox"], [data-canvas] button';

export function isKeyOwnedByControl(target: EventTarget | null, key: string): boolean {
  if (!(target instanceof Element)) return false;
  return (
    target.closest(ownsEveryKey) !== null || (key === ' ' && target.closest('button') !== null)
  );
}
