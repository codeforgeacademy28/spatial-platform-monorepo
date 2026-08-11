import { Router, type Request } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { uploadAsset, getSignedDownloadUrl } from '../services/storage-service.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gltf+json', 'model/gltf-binary', 'application/octet-stream'];

const assetTypeSchema = z.object({
  assetType: z.enum(['model', 'image', 'blueprint']),
});

const router = Router();

router.post('/api/uploads', upload.single('file'), async (req: Request, res) => {
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

  if (!allowedMimeTypes.includes(file.mimetype)) {
    res.status(400).json({ error: 'unsupported file type', allowed: allowedMimeTypes });
    return;
  }

  if (file.size > 25 * 1024 * 1024) {
    res.status(400).json({ error: 'file too large', maxSize: '25MB' });
    return;
  }

  const magicNumber = file.buffer.slice(0, 4).toString('hex');
  const allowedMagic = ['89504e47', 'ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', '7b0d0a2d'];
  if (!allowedMagic.includes(magicNumber)) {
    res.status(400).json({ error: 'invalid file signature' });
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
