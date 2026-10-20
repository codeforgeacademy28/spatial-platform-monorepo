import { TransformControls } from '@react-three/drei';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type TransformMode = 'translate' | 'rotate' | 'scale';

interface EditableGltfAssetProps {
  url: string;
  mode: TransformMode;
  onError: (message: string) => void;
}

function disposeScene(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      material.dispose();
    }
  });
}

/** Loads a user-selected GLB or self-contained glTF and exposes transform gizmos. */
export function EditableGltfAsset({ url, mode, onError }: EditableGltfAssetProps): JSX.Element | null {
  const [scene, setScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadedScene: THREE.Group | null = null;
    setScene(null);
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (cancelled) {
          disposeScene(gltf.scene);
          return;
        }
        loadedScene = gltf.scene.clone(true);
        const bounds = new THREE.Box3().setFromObject(loadedScene);
        if (!bounds.isEmpty()) {
          const center = bounds.getCenter(new THREE.Vector3());
          loadedScene.position.x -= center.x;
          loadedScene.position.y -= bounds.min.y;
          loadedScene.position.z -= center.z;
        }
        setScene(loadedScene);
      },
      undefined,
      (error: unknown) => {
        if (!cancelled) onError(error instanceof Error ? error.message : 'The 3D model could not be loaded.');
      },
    );
    return () => {
      cancelled = true;
      if (loadedScene) disposeScene(loadedScene);
    };
  }, [url, onError]);

  if (!scene) return null;
  return (
    <TransformControls mode={mode}>
      <primitive object={scene} />
    </TransformControls>
  );
}
