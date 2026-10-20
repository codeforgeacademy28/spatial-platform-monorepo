import { Router, type Request } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { uploadAsset, getSignedDownloadUrl } from '../services/storage-service.js';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

type SupportedExtension = '.png' | '.jpg' | '.jpeg' | '.pdf' | '.glb' | '.gltf' | '.ifc' | '.dxf' | '.obj' | '.stl' | '.dwg';

const supportedExtensions: SupportedExtension[] = [
  '.png', '.jpg', '.jpeg', '.pdf', '.glb', '.gltf', '.ifc', '.dxf', '.obj', '.stl', '.dwg',
];

const assetTypeSchema = z.object({
  assetType: z.enum(['model', 'image', 'blueprint']),
});

function getExtension(filename: string): SupportedExtension | null {
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

function hasValidContentSignature(extension: SupportedExtension, buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  switch (extension) {
    case '.png':
      return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case '.jpg':
    case '.jpeg':
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case '.pdf':
      return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    case '.glb':
      return buffer.subarray(0, 4).toString('ascii') === 'glTF' && buffer.length >= 12;
    case '.dwg':
      return /^AC10\d{2}$/.test(buffer.subarray(0, 6).toString('ascii'));
    case '.gltf':
    case '.ifc':
    case '.dxf':
    case '.obj':
    case '.stl':
      return isTextModel(extension, buffer);
    default:
      return false;
  }
}

function isAllowedForAssetType(assetType: 'model' | 'image' | 'blueprint', extension: SupportedExtension): boolean {
  if (assetType === 'image') return ['.png', '.jpg', '.jpeg'].includes(extension);
  if (assetType === 'blueprint') return ['.png', '.jpg', '.jpeg', '.pdf'].includes(extension);
  return ['.glb', '.gltf', '.ifc', '.dxf', '.obj', '.stl', '.dwg'].includes(extension);
}

const router = Router();

router.post('/api/uploads', upload.single('file') as any, async (req: Request, res) => {
  const parsed = assetTypeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid asset type', details: parsed.error.flatten() });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'missing file upload' });
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    res.status(400).json({ error: 'file too large', maxSize: '25MB' });
    return;
  }

  const extension = getExtension(file.originalname);
  if (!extension || !isAllowedForAssetType(parsed.data.assetType, extension)) {
    res.status(400).json({
      error: 'unsupported file extension for this asset type',
      assetType: parsed.data.assetType,
      supportedExtensions: parsed.data.assetType === 'image'
        ? ['.png', '.jpg', '.jpeg']
        : parsed.data.assetType === 'blueprint'
          ? ['.png', '.jpg', '.jpeg', '.pdf']
          : ['.glb', '.gltf', '.ifc', '.dxf', '.obj', '.stl', '.dwg'],
    });
    return;
  }

  if (!hasValidContentSignature(extension, file.buffer)) {
    res.status(400).json({ error: 'file content does not match its extension or is malformed' });
    return;
  }

  const allowedMimeTypes = new Set([
    'application/octet-stream',
    'application/pdf',
    'application/ifc',
    'application/x-step',
    'application/dxf',
    'application/x-dxf',
    'application/vnd.dwg',
    'model/gltf-binary',
    'model/gltf+json',
    'model/stl',
    'text/plain',
    'image/png',
    'image/jpeg',
  ]);
  if (!allowedMimeTypes.has(file.mimetype)) {
    res.status(400).json({ error: 'unsupported content type', received: file.mimetype });
    return;
  }


  const key = `${parsed.data.assetType}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  try {
    await uploadAsset(key, file.buffer, file.mimetype);
    const downloadUrl = await getSignedDownloadUrl(key, 3600);

    res.status(201).json({
      key,
      url: downloadUrl,
      contentType: file.mimetype,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({
      error: 'upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
