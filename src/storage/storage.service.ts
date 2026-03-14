import ImageKit from '@imagekit/nodejs';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UploadClient } from '@uploadcare/upload-client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private imagekit: ImageKit;
  private uploadcare: UploadClient;

  constructor() {
    // Supabase
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );

    // ImageKit
    this.imagekit = new ImageKit({
      //   publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
      //   urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
    });

    // Uploadcare
    this.uploadcare = new UploadClient({
      publicKey: process.env.UPLOADCARE_PUBLIC_KEY!,
    });
  }

  // Asosiy metod — fallback zanjiri
  async uploadImage(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const providers = [
      () => this.uploadToSupabase(buffer, fileName, mimeType),
      () => this.uploadToImageKit(buffer, fileName, mimeType),
      () => this.uploadToUploadcare(buffer, fileName, mimeType),
    ];

    for (const provider of providers) {
      try {
        const url = await provider();
        return url;
      } catch (error) {
        console.warn(
          `Storage provider failed: ${error.message}, trying next...`,
        );
        continue;
      }
    }

    throw new ServiceUnavailableException(
      'Barcha storage xizmatlari mavjud emas',
    );
  }

  // 1. Supabase
  private async uploadToSupabase(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const uniqueName = `${uuidv4()}-${fileName}`;

    const { error } = await this.supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(uniqueName, buffer, { contentType: mimeType });

    if (error) throw new Error(`Supabase: ${error.message}`);

    const { data } = this.supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .getPublicUrl(uniqueName);

    return data.publicUrl;
  }

  // 2. ImageKit
  private async uploadToImageKit(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const uniqueName = `${uuidv4()}-${fileName}`;
    const base64 = buffer.toString('base64');
    console.log(mimeType, uniqueName, base64);

    const result = await this.imagekit.files.upload({
      file: base64,
      fileName: uniqueName,
      folder: '/edu-test',
    });

    const url = result.url ?? result.filePath;
    if (!url) throw new Error('ImageKit: URL qaytarilmadi');
    return url;
  }

  // 3. Uploadcare
  private async uploadToUploadcare(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const uint8Array = new Uint8Array(buffer);
    const file = new File([uint8Array], fileName, { type: mimeType });

    const result = await this.uploadcare.uploadFile(file);
    return `https://ucarecdn.com/${result.uuid}/`;
  }

  // ============================================
  // Rasmni o'chirish — fallback zanjiri
  // ============================================
  async deleteImage(url: string): Promise<void> {
    const providers = [
      () => this.deleteFromSupabase(url),
      () => this.deleteFromImageKit(url),
      () => this.deleteFromUploadcare(url),
    ];

    for (const provider of providers) {
      try {
        await provider();
        return;
      } catch {
        continue;
      }
    }
    console.warn(`Rasm storage dan o'chirilmadi: ${url}`);
  }

  private async deleteFromSupabase(url: string): Promise<void> {
    if (!url.includes('supabase')) throw new Error('Not supabase URL');

    const bucket = process.env.SUPABASE_BUCKET!;
    const fileName = url.split(`${bucket}/`)[1];
    if (!fileName) throw new Error('Fayl nomi topilmadi');

    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) throw new Error(`Supabase delete: ${error.message}`);
  }

  private async deleteFromImageKit(url: string): Promise<void> {
    if (!url.includes('imagekit')) throw new Error('Not imagekit URL');

    // 1. URL dan fayl yo'lini olish
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT!;
    const filePath = url.replace(urlEndpoint, '');

    // 2. REST API orqali fayl ID ni topish
    const searchResponse = await fetch(
      `https://api.imagekit.io/v1/files?searchQuery=filePath="${filePath}"`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY! + ':').toString('base64')}`,
        },
      },
    );

    if (!searchResponse.ok) throw new Error('ImageKit: fayl qidirishda xato');

    const files = await searchResponse.json();
    if (!files || files.length === 0)
      throw new Error('ImageKit: fayl topilmadi');

    // 3. O'chirish
    const deleteResponse = await fetch(
      `https://api.imagekit.io/v1/files/${files[0].fileId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY! + ':').toString('base64')}`,
        },
      },
    );

    if (!deleteResponse.ok) throw new Error("ImageKit: o'chirishda xato");
  }

  private async deleteFromUploadcare(url: string): Promise<void> {
    if (!url.includes('ucarecdn')) throw new Error('Not uploadcare URL');

    const uuid = url.split('ucarecdn.com/')[1]?.replace('/', '');
    if (!uuid) throw new Error('UUID topilmadi');

    const response = await fetch(`https://api.uploadcare.com/files/${uuid}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Uploadcare.Simple ${process.env.UPLOADCARE_PUBLIC_KEY}:${process.env.UPLOADCARE_SECRET_KEY}`,
      },
    });

    if (!response.ok)
      throw new Error(`Uploadcare delete: ${response.statusText}`);
  }
}
