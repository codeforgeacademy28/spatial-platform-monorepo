import { TransformControls } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ModelTransform } from '../services/local-model-store';

type TransformMode = 'translate' | 'rotate' | 'scale';

interface EditableGltfAssetProps {
  url: string;
  mode: TransformMode;
  initialTransform: ModelTransform;
  onTransformChange: (transform: ModelTransform) => void;
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

/** Loads a local GLB or self-contained glTF and exposes persistent transform gizmos. */
export function EditableGltfAsset({ url, mode, initialTransform, onTransformChange, onError }: EditableGltfAssetProps): JSX.Element | null {
  const [assetRoot, setAssetRoot] = useState<THREE.Group | null>(null);
  const initialTransformRef = useRef(initialTransform);
  initialTransformRef.current = initialTransform;

  useEffect(() => {
    let cancelled = false;
    let loadedRoot: THREE.Group | null = null;
    setAssetRoot(null);
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (cancelled) {
          disposeScene(gltf.scene);
          return;
        }
        const root = new THREE.Group();
        const model = gltf.scene.clone(true);
        const bounds = new THREE.Box3().setFromObject(model);
        if (!bounds.isEmpty()) {
          const center = bounds.getCenter(new THREE.Vector3());
          model.position.x -= center.x;
          model.position.y -= bounds.min.y;
          model.position.z -= center.z;
        }
        root.add(model);
        const saved = initialTransformRef.current;
        root.position.set(...saved.position);
        root.rotation.set(...saved.rotation);
        root.scale.set(...saved.scale);
        loadedRoot = root;
        setAssetRoot(root);
      },
      undefined,
      (error: unknown) => {
        if (!cancelled) onError(error instanceof Error ? error.message : 'The 3D model could not be loaded.');
      },
    );
    return () => {
      cancelled = true;
      if (loadedRoot) disposeScene(loadedRoot);
    };
  }, [url, onError]);

  if (!assetRoot) return null;
  const reportTransform = (): void => {
    onTransformChange({
      position: [assetRoot.position.x, assetRoot.position.y, assetRoot.position.z],
      rotation: [assetRoot.rotation.x, assetRoot.rotation.y, assetRoot.rotation.z],
      scale: [assetRoot.scale.x, assetRoot.scale.y, assetRoot.scale.z],
    });
  };
  return (
    <TransformControls mode={mode} onObjectChange={reportTransform}>
      <primitive object={assetRoot} />
    </TransformControls>
  );
}
