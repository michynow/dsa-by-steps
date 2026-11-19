import { render, screen } from '@testing-library/react';
import en from './messages/en.json';
import { Stage } from './Stage';

const scene = { structures: [], pointers: [], highlights: [] };

function stage(stepId: string) {
  return <Stage scene={scene} messages={en} selection={undefined} turn stepId={stepId} />;
}

describe('Stage turn frame', () => {
  it('replaces the announced banner when the Step changes', () => {
    const { rerender } = render(stage('a'));
    const first = screen.getByText('Your turn — answer before the step plays');
    rerender(stage('b'));
    const second = screen.getByText('Your turn — answer before the step plays');
    expect(second === first).toBe(false);
  });

  it('keeps the banner node while the Step stays the same', () => {
    const { rerender } = render(stage('a'));
    const first = screen.getByText('Your turn — answer before the step plays');
    rerender(stage('a'));
    expect(screen.getByText('Your turn — answer before the step plays') === first).toBe(true);
  });

  it('marks the frame with a turn data attribute only while the Check is open', () => {
    const { container, rerender } = render(stage('a'));
    expect(container.querySelector('[data-stage]')?.getAttribute('data-turn')).toBe('true');
    rerender(<Stage scene={scene} messages={en} selection={undefined} turn={false} stepId="a" />);
    expect(container.querySelector('[data-stage]')?.getAttribute('data-turn')).toBe('false');
  });
});
