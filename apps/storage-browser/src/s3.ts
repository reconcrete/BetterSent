import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  type _Object,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.STORAGE_S3_ENDPOINT,
  region: process.env.AWS_REGION ?? "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.STORAGE_S3_BUCKET!;

export interface ListResult {
  folders: string[];
  files: { key: string; size: number; lastModified: string }[];
}

export async function listObjects(prefix: string): Promise<ListResult> {
  const folders: string[] = [];
  const files: ListResult["files"] = [];
  let continuationToken: string | undefined;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix || undefined,
        Delimiter: "/",
        ContinuationToken: continuationToken,
      })
    );

    if (res.CommonPrefixes) {
      for (const cp of res.CommonPrefixes) {
        if (cp.Prefix) folders.push(cp.Prefix);
      }
    }

    if (res.Contents) {
      for (const obj of res.Contents) {
        if (obj.Key && obj.Key !== prefix) {
          files.push({
            key: obj.Key,
            size: obj.Size ?? 0,
            lastModified: obj.LastModified?.toISOString() ?? "",
          });
        }
      }
    }

    continuationToken = res.IsTruncated
      ? res.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return { folders, files };
}

export async function getObject(key: string) {
  const res = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  return {
    body: res.Body,
    contentType: res.ContentType ?? "application/octet-stream",
    contentLength: res.ContentLength,
  };
}
