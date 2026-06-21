import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import type { UploadedFile } from './types';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly presignExpiresIn: number;
  private readonly envPrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET')!;
    this.presignExpiresIn =
      this.configService.get<number>('S3_PRESIGN_EXPIRES_IN') ?? 3600;
    const env = this.configService.get<string>('NODE_ENV') ?? 'development';
    this.envPrefix =
      env === 'production' ? 'prod' : env === 'test' ? 'test' : 'dev';

    this.s3 = new S3Client({
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      region: this.configService.get<string>('S3_REGION') ?? 'auto',
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>(
          'S3_SECRET_ACCESS_KEY',
        )!,
      },
      forcePathStyle: false,
    });
  }

  async uploadImage(file: UploadedFile, folder: string): Promise<string> {
    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const key = `${this.envPrefix}/${folder}/${randomUUID()}.${ext}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return key;
  }

  async uploadFile(file: UploadedFile, folder: string): Promise<string> {
    const ext = file.originalname.split('.').pop() ?? 'bin';
    const key = `${this.envPrefix}/${folder}/${randomUUID()}.${ext}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return key;
  }

  getPresignedUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: this.presignExpiresIn },
    );
  }
}
