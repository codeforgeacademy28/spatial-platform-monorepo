import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

const envSchema = z.object({
  R2_ACCOUNT_ID: z.string().trim().min(1),
  R2_BUCKET_NAME: z.string().trim().min(1),
  R2_ACCESS_KEY_ID: z.string().trim().min(1),
  R2_SECRET_ACCESS_KEY: z.string().trim().min(1),
});

function getStorageClient(): { client: S3Client; bucket: string } {
  // Object storage is optional for local-only project editing and API tests.
  // Validate it only when an upload/download URL operation actually needs it.
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Object storage is not configured. Missing or invalid server settings: ${missing.join(', ')}.`);
  }
  const env = parsed.data;
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
  return { client, bucket: env.R2_BUCKET_NAME };
}

export async function uploadAsset(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<{ key: string; contentType: string; bucket: string }> {
  const { client, bucket } = getStorageClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return { key, contentType, bucket };
}

export async function getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const { client, bucket } = getStorageClient();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
