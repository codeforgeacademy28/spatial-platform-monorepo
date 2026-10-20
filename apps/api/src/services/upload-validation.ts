export type SupportedExtension = '.png' | '.jpg' | '.jpeg' | '.pdf' | '.glb' | '.gltf' | '.ifc' | '.dxf' | '.obj' | '.stl' | '.dwg';

const supportedExtensions: SupportedExtension[] = [
  '.png', '.jpg', '.jpeg', '.pdf', '.glb', '.gltf', '.ifc', '.dxf', '.obj', '.stl', '.dwg',
];

export function getExtension(filename: string): SupportedExtension | null {
  const extension = filename.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
  return extension && supportedExtensions.includes(extension as SupportedExtension)
    ? (extension as SupportedExtension)
    : null;
}

function isTextModel(extension: SupportedExtension, buffer: Buffer): boolean {
  if (buffer.includes(0)) return false;
  const text = buffer.toString('utf8', 0, Math.min(buffer.length, 4096)).trimStart();
  switch (extension) {
    case '.gltf': {
      try {
        const parsed = JSON.parse(buffer.toString('utf8')) as { asset?: { version?: string } };
        return typeof parsed.asset?.version === 'string' && parsed.asset.version.startsWith('2.');
      } catch {
        return false;
      }
    }
    case '.ifc':
      return text.startsWith('ISO-10303-21;');
    case '.dxf':
      return /^0\s*\nSECTION\b/i.test(text) || /^0\s*\r\nSECTION\b/i.test(text);
    case '.obj':
      return /^(?:v|vt|vn|f|o|g|mtllib)\s+/m.test(text);
    case '.stl':
      return /^solid\b/i.test(text) && /facet\s+normal/i.test(text) && /vertex\s+/i.test(text);
    default:
      return false;
  }
}

export function hasValidContentSignature(extension: SupportedExtension, buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  switch (extension) {
    case '.png':
      return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case '.jpg':
    case '.jpeg':
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case '.pdf':
      return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    case '.glb': {
      if (buffer.subarray(0, 4).toString('ascii') !== 'glTF' || buffer.length < 12) return false;
      const declaredLength = buffer.readUInt32LE(8);
      return declaredLength >= 12 && declaredLength <= buffer.length;
    }
    case '.dwg':
      return /^AC10\d{2}$/.test(buffer.subarray(0, 6).toString('ascii'));
    case '.gltf':
    case '.ifc':
    case '.dxf':
    case '.obj':
      return isTextModel(extension, buffer);
    case '.stl': {
      if (isTextModel(extension, buffer)) return true;
      // Binary STL: 80-byte header, 4-byte triangle count, then 50 bytes per triangle.
      if (buffer.length < 84) return false;
      const triangleCount = buffer.readUInt32LE(80);
      return 84 + triangleCount * 50 <= buffer.length && triangleCount > 0;
    }
    default:
      return false;
  }
}

export function isAllowedForAssetType(
  assetType: 'model' | 'image' | 'blueprint',
  extension: SupportedExtension,
): boolean {
  if (assetType === 'image') return ['.png', '.jpg', '.jpeg'].includes(extension);
  if (assetType === 'blueprint') return ['.png', '.jpg', '.jpeg', '.pdf'].includes(extension);
  return ['.glb', '.gltf', '.ifc', '.dxf', '.obj', '.stl', '.dwg'].includes(extension);
}
