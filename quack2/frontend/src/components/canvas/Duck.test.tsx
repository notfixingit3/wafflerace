import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JSDOM } from 'jsdom';
import Duck from './Duck';

if (typeof document === 'undefined') {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window as unknown as Window & typeof globalThis;
}

vi.mock('@react-three/drei', () => ({
  Text: ({
    children,
    position,
    fontSize,
    color,
  }: {
    children: React.ReactNode;
    position: [number, number, number];
    fontSize: number;
    color: string;
  }) => (
    <span
      data-testid="duck-label"
      data-position={JSON.stringify(position)}
      data-fontsize={fontSize}
      data-color={color}
    >
      {children}
    </span>
  ),
}));

describe('Duck', () => {
  it('renders a sphere mesh with the provided color', () => {
    const { container } = render(
      <Duck id="duck-1" name="Ducky" x={10} y={0} z={5} color="#ff5722" />,
    );

    const mesh = container.querySelector('mesh');
    expect(mesh).not.toBeNull();

    const geometry = container.querySelector('spheregeometry');
    expect(geometry).not.toBeNull();

    const material = container.querySelector('meshstandardmaterial');
    expect(material).not.toBeNull();
    expect(material?.getAttribute('color')).toBe('#ff5722');
  });

  it('renders the duck name as a floating label above the sphere', () => {
    render(<Duck id="duck-2" name="Speedy" x={-3} y={1} z={12} color="#00ff00" />);

    const label = screen.getByTestId('duck-label');
    expect(label).not.toBeNull();
    expect(label.textContent).toBe('Speedy');
    expect(label.getAttribute('data-position')).toBe('[-3,3.5,12]');
    expect(label.getAttribute('data-fontsize')).toBe('1.2');
    expect(label.getAttribute('data-color')).toBe('white');
  });
});
