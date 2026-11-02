import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "./env";
import { logger } from "./logger";

export class NeonStorage {
  private static client: S3Client | null = null;

  public static getClient(): S3Client | null {
    if (this.client) {
      return this.client;
    }

    const endpoint =
      env.NEON_STORAGE_ENDPOINT ||
      process.env.NEON_STORAGE_ENDPOINT ||
      env.AWS_ENDPOINT_URL_S3 ||
      process.env.AWS_ENDPOINT_URL_S3;
    const accessKeyId =
      env.NEON_STORAGE_ACCESS_KEY_ID ||
      process.env.NEON_STORAGE_ACCESS_KEY_ID ||
      env.AWS_ACCESS_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      env.NEON_STORAGE_SECRET_ACCESS_KEY ||
      process.env.NEON_STORAGE_SECRET_ACCESS_KEY ||
      env.AWS_SECRET_ACCESS_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY;
    const region =
      env.NEON_STORAGE_REGION ||
      process.env.NEON_STORAGE_REGION ||
      env.AWS_REGION ||
      process.env.AWS_REGION ||
      "ap-southeast-1";

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      return null;
    }

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    return this.client;
  }

  public static isConfigured(): boolean {
    return !!this.getClient();
  }

  public static getBucketName(): string {
    return (
      env.NEON_STORAGE_BUCKET ||
      process.env.NEON_STORAGE_BUCKET ||
      env.S3_BUCKET ||
      process.env.S3_BUCKET ||
      "assets"
    );
  }

  /**
   * Uploads an object (e.g. audit report, snapshot, image) to Neon Object Storage
   */
  public static async uploadObject(
    key: string,
    body: string | Buffer | Uint8Array,
    contentType: string = "text/plain"
  ): Promise<{ key: string; bucket: string; url: string }> {
    const s3 = this.getClient();
    if (!s3) {
      throw new Error("Neon Object Storage is not configured.");
    }

    const bucket = this.getBucketName();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3.send(command);

    const endpoint = (
      env.NEON_STORAGE_ENDPOINT ||
      process.env.NEON_STORAGE_ENDPOINT ||
      env.AWS_ENDPOINT_URL_S3 ||
      process.env.AWS_ENDPOINT_URL_S3 ||
      ""
    ).replace(/\/+$/, "");
    const url = `${endpoint}/${bucket}/${key}`;

    logger.info("Uploaded object to Neon Object Storage", { key, bucket, url });
    return { key, bucket, url };
  }

  /**
   * Retrieves an object from Neon Object Storage
   */
  public static async getObject(key: string): Promise<string> {
    const s3 = this.getClient();
    if (!s3) {
      throw new Error("Neon Object Storage is not configured.");
    }

    const bucket = this.getBucketName();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3.send(command);
    if (!response.Body) {
      return "";
    }

    return await response.Body.transformToString("utf-8");
  }

  /**
   * Deletes an object from Neon Object Storage
   */
  public static async deleteObject(key: string): Promise<void> {
    const s3 = this.getClient();
    if (!s3) return;

    const bucket = this.getBucketName();
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3.send(command);
  }

  /**
   * Checks if an object exists in Neon Object Storage
   */
  public static async exists(key: string): Promise<boolean> {
    const s3 = this.getClient();
    if (!s3) return false;

    try {
      const bucket = this.getBucketName();
      await s3.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }
}
