import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import RaceScene from './RaceScene';

vi.mock('@react-three/fiber', () => ({
  // eslint-disable-next-line no-unused-vars
  Canvas: ({ children, camera, ...props }: { children: React.ReactNode; camera?: unknown }) => (
    <div data-testid="canvas" {...props}>{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    camera: { lookAt: vi.fn() },
  })),
}));

describe('RaceScene', () => {
  it('renders Canvas with children', () => {
    render(
      <RaceScene>
        <div data-testid="child">Duck</div>
      </RaceScene>
    );

    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders ambient and directional lights', () => {
    const { container } = render(<RaceScene />);

    expect(container.querySelector('ambientlight')).toBeInTheDocument();
    expect(container.querySelector('directionallight')).toBeInTheDocument();
  });

  it('sets the background color to sky blue', () => {
    const { container } = render(<RaceScene />);
    const background = container.querySelector('color[args="#87CEEB"]');
    expect(background).toBeInTheDocument();
  });

  it('accepts a leadDuck prop without crashing', () => {
    const { container } = render(
      <RaceScene leadDuck={{ x: 5, z: 50 }} />
    );

    expect(container.querySelector('ambientlight')).toBeInTheDocument();
    expect(container.querySelector('directionallight')).toBeInTheDocument();
  });
});
