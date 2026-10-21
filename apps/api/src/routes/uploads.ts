import { Router, type Request } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { uploadAsset, getSignedDownloadUrl } from '../services/storage-service.js';
import { getExtension, hasValidContentSignature, isAllowedForAssetType } from '../services/upload-validation.js';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

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
