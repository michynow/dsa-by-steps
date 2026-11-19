import { isKeyOwnedByControl } from './key-ownership';

const keys = ['ArrowLeft', 'ArrowRight', 'r', ' '];

function owned(markup: string, selector: string): readonly boolean[] {
  const host = document.body.appendChild(document.createElement('div'));
  host.innerHTML = markup;
  try {
    const target = host.querySelector(selector);
    return keys.map((key) => isKeyOwnedByControl(target, key));
  } finally {
    host.remove();
  }
}

describe('isKeyOwnedByControl', () => {
  it.each([
    ['an input', '<input />', 'input'],
    ['a textarea', '<textarea></textarea>', 'textarea'],
    ['a select', '<select><option>a</option></select>', 'select'],
    ['a contenteditable', '<div contenteditable="true"><span>x</span></div>', 'span'],
    ['a radio group', '<div role="radiogroup"><span>x</span></div>', 'span'],
    ['a radio', '<div role="radio"></div>', '[role=radio]'],
    ['a textbox', '<div role="textbox"></div>', '[role=textbox]'],
    [
      'a selection overlay button',
      '<div data-canvas="true"><button type="button">pick</button></div>',
      'button',
    ],
  ])('owns every key inside %s', (_name, markup, selector) => {
    expect(owned(markup, selector)).toEqual([true, true, true, true]);
  });

  it('leaves arrows and R but owns Space on a Stage playback button', () => {
    expect(
      owned(
        '<div data-stage="true"><div role="group"><button>Replay</button></div></div>',
        'button',
      ),
    ).toEqual([false, false, false, true]);
  });

  it('owns nothing on the page body or a missing target', () => {
    expect([owned('<p>text</p>', 'p'), keys.map((key) => isKeyOwnedByControl(null, key))]).toEqual([
      [false, false, false, false],
      [false, false, false, false],
    ]);
  });
});
