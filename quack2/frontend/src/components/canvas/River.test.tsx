/// <reference types="vitest/globals" />
import React from 'react';
import type { Renderer as ReactThreeTestRenderer } from '@react-three/test-renderer/dist/declarations/src/types/public';
import type { Mesh } from 'three';
import { create, act } from '@react-three/test-renderer';
import River from './River';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('River', () => {
  it('renders without errors', async () => {
    let renderer: ReactThreeTestRenderer | undefined;
    await act(async () => {
      renderer = await create(<River />);
    });
    expect(renderer).toBeDefined();
    expect(renderer!.scene.children.length).toBeGreaterThan(0);
  });

  it('has a mesh with plane geometry', async () => {
    let renderer: ReactThreeTestRenderer | undefined;
    await act(async () => {
      renderer = await create(<River />);
    });
    await flushPromises();

    const meshes = renderer!.scene.findAllByType('Mesh');
    expect(meshes.length).toBe(1);
    const mesh = meshes[0].instance as Mesh;
    expect(mesh.geometry.type).toBe('PlaneGeometry');
  });

  it('has a material applied to the plane', async () => {
    let renderer: ReactThreeTestRenderer | undefined;
    await act(async () => {
      renderer = await create(<River />);
    });
    await flushPromises();

    const mesh = renderer!.scene.findAllByType('Mesh')[0].instance as Mesh;
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    expect(material).toBeDefined();
    expect(material.type).toBe('MeshStandardMaterial');
  });

  it('is positioned below the ducks and spans the race length', async () => {
    let renderer: ReactThreeTestRenderer | undefined;
    await act(async () => {
      renderer = await create(<River />);
    });
    await flushPromises();

    const mesh = renderer!.scene.findAllByType('Mesh')[0].instance as Mesh;
    expect(mesh.position.toArray()).toEqual([0, -2, 100]);
    expect(mesh.rotation.toArray().slice(0, 3)).toEqual([
      -Math.PI / 2,
      0,
      0,
    ]);
  });
});
