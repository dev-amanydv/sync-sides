import fs from "fs";
import path from "path";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface StoredFile {
  // Stable URL saved in the DB. For R2 this points at the backend redirect
  // endpoint (which mints a fresh presigned URL on each request); for local
  // dev it's the direct /merged static mount.
  url: string;
  // false means the file is served from local disk and must not be deleted
  offloaded: boolean;
}

const PRESIGN_TTL_SECONDS = 60 * 60 * 6; // 6h — plenty for a playback/download

// Lazy so env vars are read after dotenv has run, not at import time.
let r2: S3Client | null | undefined;

const bucket = () => process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "";

const getR2 = (): S3Client | null => {
  if (r2 !== undefined) return r2;
  const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID } = process.env;
  const endpoint =
    process.env.R2_ENDPOINT ||
    (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");

  if (R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && endpoint && bucket()) {
    r2 = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  } else {
    r2 = null;
  }
  return r2;
};

export const r2Enabled = () => getR2() !== null;

const publicBase = () =>
  (process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, "");

// Deterministic object key for a meeting's merged recording.
export const recordingKey = (meetingId: string) => `recordings/${meetingId}.mp4`;

// Uploads the merged video to R2 (streamed, so memory stays flat). R2 buckets
// are private by default, so instead of a public URL we save the backend
// redirect endpoint and presign on read. Without R2 credentials it falls back
// to serving from the local /merged static mount so local dev needs zero setup.
export const storeRecording = async (filePath: string): Promise<StoredFile> => {
  const fileName = path.basename(filePath);
  const meetingId = fileName.replace(/\.mp4$/, "");
  const client = getR2();

  if (!client) {
    return { url: `${publicBase()}/merged/${fileName}`, offloaded: false };
  }

  const upload = new Upload({
    client,
    params: {
      Bucket: bucket(),
      Key: recordingKey(meetingId),
      Body: fs.createReadStream(filePath),
      ContentType: "video/mp4",
    },
    queueSize: 2,
    partSize: 8 * 1024 * 1024,
  });

  await upload.done();
  return { url: `${publicBase()}/api/recordings/file/${meetingId}`, offloaded: true };
};

// Fresh presigned GET URL for a stored object, or null if R2 isn't configured.
// `downloadName` forces a browser download via Content-Disposition.
export const presignRecording = async (
  meetingId: string,
  downloadName?: string
): Promise<string | null> => {
  const client = getR2();
  if (!client) return null;
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket(),
      Key: recordingKey(meetingId),
      ...(downloadName
        ? { ResponseContentDisposition: `attachment; filename="${downloadName}"` }
        : {}),
    }),
    { expiresIn: PRESIGN_TTL_SECONDS }
  );
};
